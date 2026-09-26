import { getDiagramAdapter } from '../diagrams/adapter';
import { registerBuiltInAdapters } from '../diagrams/register-built-in-adapters';
import { classifyDiagram, withParseResult, withPreviewResult } from '../diagrams/capability';
import type { DiagramType } from '../diagrams/capability';
import type { AdapterDiagramType, DiagramAdapterContext } from '../diagrams/adapter';
import { SourceDocument } from '../source/source-document';
import type { EditorError, EditorSelection, MermaidVisualEditor, MermaidVisualEditorOptions } from './types';
import { DestroyedEditorError } from './types';
import { appendPaletteEntry, diagramTypeFromSource, diagramTypes, paletteCatalog, templates, type EditableDiagramType } from './diagram-catalog';
import { MermaidRendererError, renderMermaid } from '../renderer/mermaid-renderer';

const previewDebounceMs = 120;
type EditorStatusState = 'loading' | 'empty' | 'error' | 'unsupported' | 'unknown' | 'source-only' | 'ready';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateContainer(container: unknown): asserts container is HTMLElement {
  if (
    container === null ||
    typeof container !== 'object' ||
    (container as Node).nodeType !== 1 ||
    (container as Element).namespaceURI !== 'http://www.w3.org/1999/xhtml' ||
    typeof (container as HTMLElement).appendChild !== 'function' ||
    typeof (container as HTMLElement).ownerDocument?.createElement !== 'function'
  ) {
    throw new TypeError('container must be an HTMLElement.');
  }
}

function reportCallbackFailure(error: unknown): void {
  queueMicrotask(() => {
    throw error;
  });
}

function preserveLineEndingStyle(editedSource: string, previousSource: string): string {
  const lineEnding = /\r\n|\r|\n/.exec(previousSource)?.[0] ?? '\n';
  return editedSource.replace(/\r\n|\r|\n/g, lineEnding);
}

function notifyError(callback: MermaidVisualEditorOptions['onError'], error: EditorError): void {
  if (!callback) return;
  try {
    callback(error);
  } catch (callbackError) {
    reportCallbackFailure(callbackError);
  }
}

function copySelection(selection: EditorSelection): EditorSelection {
  return Object.freeze({ ...selection });
}

function selectionsEqual(left: EditorSelection | null, right: EditorSelection | null): boolean {
  if (left === right) return true;
  if (left === null || right === null || left.kind !== right.kind) return false;
  if (left.kind === 'node' && right.kind === 'node') {
    return left.diagramType === right.diagramType && left.id === right.id;
  }
  if (left.kind === 'edge' && right.kind === 'edge') {
    return left.diagramType === right.diagramType && left.source === right.source && left.target === right.target
      && left.occurrence === right.occurrence;
  }
  return left.kind === 'subgraph' && right.kind === 'subgraph'
    && left.diagramType === right.diagramType && left.id === right.id && left.title === right.title;
}

function isAdapterDiagramType(diagramType: DiagramType): diagramType is AdapterDiagramType {
  return diagramType !== 'unknown' && diagramType !== 'unsupported';
}

export function createMermaidVisualEditor(
  container: HTMLElement,
  options: MermaidVisualEditorOptions,
): MermaidVisualEditor {
  validateContainer(container);
  if (!isPlainObject(options)) throw new TypeError('options must be a plain object.');
  const initialValue = options.value;
  const onChange = options.onChange;
  const onSelectionChange = options.onSelectionChange;
  const onError = options.onError;
  const onSave = options.onSave;
  const onReset = options.onReset;
  const onRemove = options.onRemove;
  if (typeof initialValue !== 'string') throw new TypeError('options.value must be a string.');
  for (const [name, callback] of [
    ['onChange', onChange],
    ['onSelectionChange', onSelectionChange],
    ['onError', onError],
    ['onSave', onSave],
    ['onReset', onReset],
    ['onRemove', onRemove],
  ] as const) {
    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError(`options.${name} must be a function when provided.`);
    }
  }

  registerBuiltInAdapters();

  let value = initialValue;
  let destroyed = false;
  let renderRevision = 0;
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  let currentSelection: EditorSelection | null = null;
  let draftSource: string | null = null;
  let draftMutationError = false;
  let adapterCleanup: (() => void) | undefined;
  let adapterIsActive = false;
  let activeDiagramType: EditableDiagramType = diagramTypeFromSource(initialValue) ?? 'flowchart';
  const history: string[] = [initialValue];
  let historyIndex = 0;
  let lastValidSvg = '';

  function syncDiagramType(type: DiagramType): void {
    if (type === 'unknown' || type === 'unsupported') return;
    activeDiagramType = type;
    typeSelect.value = type;
  }

  function renderFallbackPalette(type: EditableDiagramType): void {
    palette.replaceChildren();
    const items = paletteCatalog[type] ?? [];
    let currentGroup = '';
    let groupElement: HTMLElement | undefined;
    for (const entry of items) {
      if (entry.group !== currentGroup) {
        currentGroup = entry.group;
        groupElement = container.ownerDocument.createElement('section');
        groupElement.className = 'mve-palette-group';
        const heading = container.ownerDocument.createElement('h3');
        heading.textContent = currentGroup;
        groupElement.append(heading);
        palette.append(groupElement);
      }
      const button = container.ownerDocument.createElement('button');
      button.type = 'button';
      button.className = 'mve-palette-item';
      const label = container.ownerDocument.createElement('span');
      label.textContent = entry.label;
      const icon = container.ownerDocument.createElement('span');
      icon.className = 'mve-palette-icon';
      icon.textContent = entry.icon;
      button.append(label, icon);
      button.title = entry.snippet;
      button.draggable = true;
      const add = (): void => commitValue(appendPaletteEntry(value, type, entry), true);
      button.addEventListener('click', add);
      button.addEventListener('dragstart', (event) => event.dataTransfer?.setData('application/x-mve-source-palette', entry.snippet));
      groupElement?.append(button);
    }
    if (!items.length) {
      const help = container.ownerDocument.createElement('p');
      help.className = 'mve-palette-help';
      help.textContent = 'Visual palette editing is not available for this diagram type. Edit the Mermaid source below.';
      palette.append(help);
    }
  }

  function groupAdapterPalette(type: EditableDiagramType): void {
    if (type !== 'flowchart') return;
    const adapterPalette = toolbar.querySelector<HTMLElement>('[class$="-palette"]');
    if (!adapterPalette) return;
    const controls = [...adapterPalette.children];
    const groups = [{ title: 'Nodes', count: 8 }, { title: 'Edges', count: Math.max(0, controls.length - 9) }, { title: 'Containers', count: 1 }];
    const ordered = controls;
    const flowchartIcons = ['[ ]', '{ }', '( )', '(( ))', '([ ])', '[[ ]]', '[( )]', '{{ }}', '-->', '-->|', '-.->', '==>', '{}'];
    const flowchartNames = ['Process box', 'Decision', 'Rounded', 'Circle', 'Stadium', 'Subroutine', 'Database', 'Hexagon', 'Arrow', 'Labeled arrow', 'Dashed', 'Thick', 'Subgraph'];
    ordered.forEach((control, position) => {
      if (!(control instanceof HTMLButtonElement) || !flowchartNames[position]) return;
      const label = container.ownerDocument.createElement('span');
      label.textContent = flowchartNames[position]!;
      const icon = container.ownerDocument.createElement('span');
      icon.className = 'mve-palette-icon';
      icon.textContent = flowchartIcons[position]!;
      control.replaceChildren(label, icon);
    });
    adapterPalette.replaceChildren();
    let index = 0;
    for (const group of groups) {
      const section = container.ownerDocument.createElement('section');
      section.className = 'mve-palette-group';
      const heading = container.ownerDocument.createElement('h3');
      heading.textContent = group.title;
      section.append(heading);
      for (let count = 0; count < group.count && index < ordered.length; count++) section.append(ordered[index++]!);
      adapterPalette.append(section);
    }
  }

  async function save(): Promise<void> {
    if (!onSave) {
      setStatus('source-only', 'Save is unavailable until the host provides an onSave callback.');
      return;
    }
    try {
      await onSave(value);
      setStatus('ready', 'Save request completed.');
    } catch (cause) {
      setStatus('error', cause instanceof Error ? `Save failed: ${cause.message}` : 'Save failed.');
      notifyError(onError, { code: 'save', message: cause instanceof Error ? cause.message : 'Save failed.', cause });
    }
  }

  function reset(): void {
    if (value !== templates[activeDiagramType] && !container.ownerDocument.defaultView?.confirm('Replace the current source with the default diagram template?')) return;
    const next = templates[activeDiagramType];
    commitValue(next, true);
    setStatus('ready', `${diagramTypes.find((item) => item.id === activeDiagramType)?.label ?? 'Diagram'} reset.`);
    try {
      const result = onReset?.(next);
      if (result && typeof (result as Promise<void>).then === 'function') {
        void (result as Promise<void>).catch((cause) => {
          setStatus('error', cause instanceof Error ? `Reset callback failed: ${cause.message}` : 'Reset callback failed.');
          notifyError(onError, { code: 'mutation', message: cause instanceof Error ? cause.message : 'Reset callback failed.', cause });
        });
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Reset callback failed.';
      setStatus('error', message);
      notifyError(onError, { code: 'mutation', message, cause });
    }
  }

  const root = container.ownerDocument.createElement('section');
  root.className = 'mve-root';
  root.dataset.mveRoot = '';

  const status = container.ownerDocument.createElement('div');
  status.className = 'mve-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const source = container.ownerDocument.createElement('textarea');
  source.className = 'mve-source';
  source.setAttribute('aria-label', 'Mermaid source');
  source.spellcheck = false;
  source.value = value;

  const editDialog = container.ownerDocument.createElement('dialog');
  editDialog.className = 'mve-edit-dialog';
  editDialog.setAttribute('aria-label', 'Edit selected diagram element');
  const dialogHeader = container.ownerDocument.createElement('header');
  const dialogTitle = container.ownerDocument.createElement('h2');
  dialogTitle.textContent = 'Edit element';
  const dialogClose = container.ownerDocument.createElement('button');
  dialogClose.type = 'button';
  dialogClose.textContent = 'Cancel';
  dialogClose.setAttribute('aria-label', 'Cancel element editing');
  const closeEditorDialog = (): void => {
    if (typeof editDialog.close === 'function') editDialog.close();
    else editDialog.removeAttribute('open');
  };
  dialogClose.addEventListener('click', () => {
    draftSource = null;
    setStatus('ready', 'Element changes cancelled.');
    closeEditorDialog();
  });
  dialogHeader.append(dialogTitle, dialogClose);
  const editFields = container.ownerDocument.createElement('div');
  editFields.className = 'mve-edit-fields';
  const dialogFieldValues = new WeakMap<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, string>();
  editFields.addEventListener('change', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      || event.target instanceof HTMLSelectElement) dialogFieldValues.set(event.target, event.target.value);
  });
  const dialogActions = container.ownerDocument.createElement('footer');
  const dialogApply = container.ownerDocument.createElement('button');
  dialogApply.type = 'button';
  dialogApply.textContent = 'Apply';
  dialogApply.setAttribute('aria-label', 'Apply element changes');
  dialogApply.addEventListener('click', () => {
    for (const field of editFields.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')) {
      if (dialogFieldValues.get(field) !== field.value) field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (draftMutationError) return;
    const nextSource = draftSource;
    draftSource = null;
    if (nextSource !== null && nextSource !== value) commitValue(nextSource, true);
    else setStatus('ready', 'Element changes applied.');
    closeEditorDialog();
  });
  dialogActions.append(dialogApply);
  editDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    draftSource = null;
    setStatus('ready', 'Element changes cancelled.');
    closeEditorDialog();
  });
  editDialog.append(dialogHeader, editFields, dialogActions);

  const workspace = container.ownerDocument.createElement('div');
  workspace.className = 'mve-workspace';

  const header = container.ownerDocument.createElement('header');
  header.className = 'mve-header';
  const title = container.ownerDocument.createElement('strong');
  title.textContent = 'Diagram';
  const typeSelect = container.ownerDocument.createElement('select');
  typeSelect.className = 'mve-diagram-select';
  typeSelect.setAttribute('aria-label', 'Diagram type');
  for (const item of diagramTypes) {
    const option = container.ownerDocument.createElement('option');
    option.value = item.id;
    option.textContent = item.label;
    typeSelect.append(option);
  }
  typeSelect.value = activeDiagramType;
  header.append(title, typeSelect);

  const palettePanel = container.ownerDocument.createElement('aside');
  palettePanel.className = 'mve-palette-panel';
  const paletteTitle = container.ownerDocument.createElement('h2');
  paletteTitle.textContent = 'Palette';
  const palette = container.ownerDocument.createElement('div');
  palette.className = 'mve-palette';
  palettePanel.append(paletteTitle, palette);

  const workColumn = container.ownerDocument.createElement('div');
  workColumn.className = 'mve-work-column';

  const gui = container.ownerDocument.createElement('section');
  gui.className = 'mve-gui';

  const toolbar = container.ownerDocument.createElement('div');
  toolbar.className = 'mve-toolbar mve-adapter-tools';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Diagram editing tools');
  toolbar.hidden = true;

  const canvasToolbar = container.ownerDocument.createElement('div');
  canvasToolbar.className = 'mve-canvas-toolbar';
  canvasToolbar.setAttribute('role', 'toolbar');
  canvasToolbar.setAttribute('aria-label', 'Canvas tools');

  const canvasLabel = container.ownerDocument.createElement('div');
  canvasLabel.className = 'mve-canvas-label';
  canvasLabel.textContent = 'Canvas';
  const canvasHeading = container.ownerDocument.createElement('div');
  canvasHeading.className = 'mve-canvas-heading';

  const previewStage = container.ownerDocument.createElement('div');
  previewStage.className = 'mve-preview-stage';

  const preview = container.ownerDocument.createElement('div');
  preview.className = 'mve-preview';
  preview.setAttribute('aria-label', 'Mermaid preview');
  preview.setAttribute('aria-busy', 'false');
  preview.setAttribute('role', 'region');
  previewStage.append(preview);

  const zoomLabel = container.ownerDocument.createElement('output');
  zoomLabel.className = 'mve-zoom-label';
  zoomLabel.setAttribute('aria-label', 'Zoom level');
  let zoom = 1;
  const updateZoom = (): void => {
    zoomLabel.value = `${Math.round(zoom * 100)}%`;
    zoomLabel.textContent = zoomLabel.value;
    const svg = preview.querySelector('svg');
    if (!svg) return;
    const viewBox = svg.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);
    if (viewBox?.length === 4 && viewBox[2]! > 0 && viewBox[3]! > 0) {
      svg.style.width = `${viewBox[2]! * zoom}px`;
      svg.style.height = `${viewBox[3]! * zoom}px`;
      svg.style.maxWidth = 'none';
      svg.style.transform = '';
    } else svg.style.transform = `scale(${zoom})`;
  };
  const canvasButton = (text: string, label: string, action: () => void): HTMLButtonElement => {
    const button = container.ownerDocument.createElement('button');
    button.type = 'button'; button.textContent = text; button.setAttribute('aria-label', label);
    button.addEventListener('click', action); return button;
  };
  const fitCanvas = (): void => {
    const svg = preview.querySelector('svg');
    const viewBox = svg?.getAttribute('viewBox')?.trim().split(/[ ,]+/).map(Number);
    if (viewBox?.length === 4 && viewBox[2]! > 0 && viewBox[3]! > 0 && previewStage.clientWidth && previewStage.clientHeight) {
      zoom = Math.max(0.2, Math.min(3, Math.min(
        (previewStage.clientWidth - 32) / viewBox[2]!,
        (previewStage.clientHeight - 32) / viewBox[3]!,
      )));
    } else zoom = 1;
    updateZoom();
    previewStage.scrollTo({ top: 0, left: 0 });
  };
  canvasToolbar.append(
    canvasButton('+', 'Zoom in', () => { zoom = Math.min(zoom + 0.1, 3); updateZoom(); }), zoomLabel,
    canvasButton('−', 'Zoom out', () => { zoom = Math.max(zoom - 0.1, 0.2); updateZoom(); }),
    canvasButton('Fit', 'Fit diagram', fitCanvas),
    canvasButton('Center', 'Center diagram', () => { previewStage.scrollTo({ top: (previewStage.scrollHeight - previewStage.clientHeight) / 2, left: (previewStage.scrollWidth - previewStage.clientWidth) / 2 }); }),
    canvasButton('Save', 'Save diagram', () => { void save(); }),
    canvasButton('Reset', 'Reset diagram', () => reset()),
  );

  const sourcePanel = container.ownerDocument.createElement('section');
  sourcePanel.className = 'mve-source-panel';
  sourcePanel.setAttribute('aria-label', 'Mermaid source editor');

  canvasHeading.append(canvasLabel, canvasToolbar);
  gui.append(canvasHeading, status, previewStage);
  palettePanel.append(toolbar);
  sourcePanel.append(source);
  workColumn.append(gui, sourcePanel);
  workspace.append(palettePanel, workColumn);
  root.append(header, workspace, editDialog);
  container.appendChild(root);

  const setStatus = (state: EditorStatusState, message: string, errorCode?: 'parse' | 'render'): void => {
    const busy = state === 'loading' ? 'true' : 'false';
    if (status.dataset.state !== state) status.dataset.state = state;
    if (errorCode) {
      if (status.dataset.errorCode !== errorCode) status.dataset.errorCode = errorCode;
    } else if (status.hasAttribute('data-error-code')) {
      delete status.dataset.errorCode;
    }
    if (status.textContent !== message) status.textContent = message;
    if (preview.getAttribute('aria-busy') !== busy) preview.setAttribute('aria-busy', busy);
  };

  const publishSelection = (selection: EditorSelection | null): void => {
    if (!onSelectionChange || destroyed) return;
    try {
      onSelectionChange(selection);
    } catch (callbackError) {
      reportCallbackFailure(callbackError);
    }
  };

  const setSelection = (selection: EditorSelection | null): void => {
    if (destroyed) return;
    const snapshot = selection === null ? null : copySelection(selection);
    if (selectionsEqual(currentSelection, snapshot)) return;
    const hadSelection = currentSelection !== null;
    currentSelection = snapshot;
    if (snapshot === null && draftSource !== null) {
      const nextSource = draftSource;
      draftSource = null;
      if (hadSelection) publishSelection(null);
      commitValue(nextSource, true);
      return;
    }
    if (snapshot === null && editDialog.open) closeEditorDialog();
    if (snapshot?.kind === 'node') dialogTitle.textContent = `Edit node ${snapshot.id}`;
    else if (snapshot?.kind === 'edge') dialogTitle.textContent = `Edit relationship ${snapshot.source} → ${snapshot.target}`;
    else if (snapshot?.kind === 'subgraph') dialogTitle.textContent = `Edit subgraph ${snapshot.title ?? snapshot.id}`;
    publishSelection(snapshot);
  };

  const openSelectionEditor = (): void => {
    if (!currentSelection || editDialog.open) return;
    draftSource = value;
    draftMutationError = false;
    for (const field of editFields.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')) {
      dialogFieldValues.set(field, field.value);
    }
    if (typeof editDialog.showModal === 'function') editDialog.showModal();
    else editDialog.setAttribute('open', '');
    editFields.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
  };

  const unmountDiagramAdapter = (): void => {
    const cleanup = adapterCleanup;
    adapterCleanup = undefined;
    adapterIsActive = false;
    if (!cleanup && toolbar.hidden && toolbar.childNodes.length === 0) return;
    toolbar.hidden = true;
    try {
      cleanup?.();
    } catch (cause) {
      if (!destroyed) {
        notifyError(onError, {
          code: 'render',
          message: cause instanceof Error ? cause.message : 'Diagram editor cleanup failed.',
          cause,
        });
      }
    } finally {
      toolbar.replaceChildren();
      editFields.replaceChildren();
      if (editDialog.open) closeEditorDialog();
    }
  };

  const scheduleRender = (): void => {
    if (renderTimer !== undefined) clearTimeout(renderTimer);
    const revision = ++renderRevision;
    unmountDiagramAdapter();
    if (destroyed) return;
    setStatus('loading', 'Updating Mermaid preview…');
    renderTimer = setTimeout(() => {
      renderTimer = undefined;
      void render(revision);
    }, previewDebounceMs);
  };

  const render = async (revision: number): Promise<void> => {
    if (destroyed || revision !== renderRevision) return;
    const currentValue = value;
    let capability = classifyDiagram(undefined);
    setStatus('loading', capability.diagramType === 'unknown'
      ? 'Rendering Mermaid preview…'
      : `Rendering ${capability.diagramType} preview…`);

    if (!currentValue.trim()) {
      preview.replaceChildren();
      lastValidSvg = '';
      setStatus('empty', 'Enter Mermaid source to see a preview.');
      return;
    }

    let result: Awaited<ReturnType<typeof renderMermaid>>;
    try {
      result = await renderMermaid(currentValue);
    } catch (cause) {
      if (destroyed || revision !== renderRevision) return;
      if (lastValidSvg) preview.innerHTML = lastValidSvg;
      else preview.replaceChildren();
      const detail = cause instanceof Error ? cause.message.replace(/\s+/g, ' ').slice(0, 180) : 'Unknown render error';
      const warning = container.ownerDocument.createElement('div');
      warning.className = 'mve-preview-error';
      warning.setAttribute('role', 'alert');
      const parseError = cause instanceof MermaidRendererError && cause.stage === 'parse';
      warning.textContent = parseError
        ? `Mermaid syntax error: ${detail}. Fix the source below to update the canvas.`
        : `Mermaid render error: ${detail}. Edit the source below to try again.`;
      preview.prepend(warning);
      const code = parseError ? 'parse' : 'render';
      const sourceMessage = parseError ? 'Mermaid source has a syntax error' : 'Mermaid preview could not be rendered';
      setStatus('error', `${sourceMessage}: ${detail}. Source editing is available.`, code);
      notifyError(onError, {
        code,
        message: cause instanceof MermaidRendererError && cause.cause instanceof Error
          ? cause.cause.message
          : cause instanceof Error ? cause.message : 'Unknown Mermaid rendering error.',
        cause,
      });
      return;
    }

    if (destroyed || revision !== renderRevision) return;
    capability = classifyDiagram(result.diagramType);
    syncDiagramType(capability.diagramType);
    capability = withParseResult(capability, true);
    capability = withPreviewResult(capability, true);
    preview.innerHTML = result.svg;
    lastValidSvg = result.svg;
    updateZoom();
    result.bindFunctions?.(preview);
    let mounted = false;
    if (isAdapterDiagramType(capability.diagramType)) {
      mounted = mountDiagramAdapter(capability.diagramType, currentValue, revision);
      if (destroyed || revision !== renderRevision) return;
      if (mounted) capability = { ...capability, editor: 'visual' };
    }
    palette.hidden = mounted;
    if (!mounted && capability.diagramType !== 'unsupported' && capability.diagramType !== 'unknown') {
      renderFallbackPalette(capability.diagramType);
    }
    if (capability.diagramType === 'unsupported') {
      palette.hidden = false;
      palette.replaceChildren();
      const help = container.ownerDocument.createElement('p');
      help.className = 'mve-palette-help';
      help.textContent = 'This diagram type is not supported for visual editing. Edit the Mermaid source below.';
      palette.append(help);
      setStatus('unsupported', 'This Mermaid diagram type is not visually supported. Preview and source editing are available.');
    } else if (capability.diagramType === 'unknown') {
      palette.hidden = false;
      palette.replaceChildren();
      const help = container.ownerDocument.createElement('p');
      help.className = 'mve-palette-help';
      help.textContent = 'The diagram type could not be identified. Edit the Mermaid source below.';
      palette.append(help);
      setStatus('unknown', 'Mermaid preview is ready, but the diagram type could not be identified. Source editing is available.');
    } else if (capability.editor === 'source-only') {
      setStatus('source-only', `${capability.diagramType} preview is ready. Visual editing is unavailable; source editing is available.`);
    } else {
      setStatus('ready', `${capability.diagramType} diagram preview is ready.`);
    }
  };

  const commitValue = (nextValue: string, notify: boolean): void => {
    if (nextValue === value) return;
    value = nextValue;
    activeDiagramType = diagramTypeFromSource(nextValue) ?? activeDiagramType;
    typeSelect.value = activeDiagramType;
    if (source.value !== nextValue) source.value = nextValue;
    if (notify) {
      history.splice(historyIndex + 1);
      history.push(nextValue);
      historyIndex = history.length - 1;
    }
    draftSource = null;
    const hadSelection = currentSelection !== null;
    currentSelection = null;
    if (editDialog.open) closeEditorDialog();
    adapterIsActive = false;
    if (notify && onChange) {
      try {
        onChange(nextValue);
      } catch (callbackError) {
        reportCallbackFailure(callbackError);
      }
    }
    if (hadSelection) publishSelection(null);
    if (!destroyed) scheduleRender();
  };

  const mountDiagramAdapter = (
    diagramType: AdapterDiagramType,
    sourceValue: string,
    revision: number,
  ): boolean => {
    const adapter = getDiagramAdapter(diagramType);
    const svg = preview.querySelector('svg');
    if (!adapter || !svg) return false;

    const applyAdapterMutation = (mutate: (source: SourceDocument) => string, removing = false): boolean => {
      if (destroyed || !adapterIsActive || revision !== renderRevision) return false;
      try {
        if (typeof mutate !== 'function') throw new TypeError('Source mutation must be a function.');
        const sourceBase = draftSource ?? value;
        const nextSource = mutate(new SourceDocument(sourceBase, diagramType));
        if (typeof nextSource !== 'string') throw new TypeError('Source mutation must return a string.');
        if (nextSource === sourceBase) return false;
        const removedSelection = removing ? currentSelection : null;
        if (draftSource !== null && !removing) {
          draftSource = nextSource;
          draftMutationError = false;
          setStatus('ready', 'Element changes are pending. Apply or cancel to continue.');
        } else {
          draftSource = null;
          commitValue(nextSource, true);
          if (removing) setStatus('ready', 'Element removed.');
          if (removedSelection && onRemove) {
            try {
              void Promise.resolve(onRemove(removedSelection, nextSource)).catch((cause) => {
                const message = cause instanceof Error ? cause.message : 'Remove callback failed.';
                setStatus('error', message);
                notifyError(onError, { code: 'mutation', message, cause });
              });
            } catch (cause) {
              const message = cause instanceof Error ? cause.message : 'Remove callback failed.';
              setStatus('error', message);
              notifyError(onError, { code: 'mutation', message, cause });
            }
          }
        }
        return true;
      } catch (cause) {
        if (draftSource !== null) draftMutationError = true;
        const message = cause instanceof Error ? cause.message : 'Mermaid source mutation failed.';
        setStatus('error', message);
        notifyError(onError, { code: 'mutation', message, cause });
        return false;
      }
    };

    const context: DiagramAdapterContext = {
      diagramType,
      toolbar,
      canvas: preview,
      svg,
      sourceDocument: new SourceDocument(sourceValue, diagramType),
      applySourceMutation(mutate): boolean { return applyAdapterMutation(mutate); },
      removeSourceMutation(mutate): boolean { return applyAdapterMutation(mutate, true); },
      setSelection(selection): void {
        if (!adapterIsActive || revision !== renderRevision) return;
        if (selection !== null && selection.diagramType !== diagramType) {
          notifyError(onError, {
            code: 'mutation',
            message: 'Diagram adapter selection does not match the active diagram type.',
          });
          return;
        }
        setSelection(selection);
      },
    };

    toolbar.replaceChildren();
    toolbar.hidden = false;
    adapterIsActive = true;
    try {
      const cleanup = adapter.mount(context);
      if (destroyed || revision !== renderRevision) {
        adapterIsActive = false;
        try {
          cleanup?.();
        } finally {
          toolbar.replaceChildren();
          toolbar.hidden = true;
          editFields.replaceChildren();
          if (editDialog.open) closeEditorDialog();
        }
        return false;
      }
      adapterCleanup = () => {
        adapterIsActive = false;
        cleanup();
      };
      groupAdapterPalette(diagramType);
      const selectionPanel = toolbar.querySelector<HTMLElement>('[class$="-selection"]');
      if (selectionPanel) editFields.append(selectionPanel);
      return true;
    } catch (cause) {
      adapterIsActive = false;
      unmountDiagramAdapter();
      if (!destroyed) {
        notifyError(onError, {
          code: 'render',
          message: cause instanceof Error ? cause.message : 'Diagram editor could not be mounted.',
          cause,
        });
      }
      return false;
    }
  };

  const handleInput = (): void => {
    if (destroyed) return;
    commitValue(preserveLineEndingStyle(source.value, value), true);
  };

  const restoreHistory = (offset: number): void => {
    const nextIndex = historyIndex + offset;
    if (nextIndex < 0 || nextIndex >= history.length) return;
    historyIndex = nextIndex;
    commitValue(history[nextIndex]!, false);
    if (onChange) {
      try { onChange(value); } catch (cause) { reportCallbackFailure(cause); }
    }
    setStatus('ready', offset < 0 ? 'Change undone.' : 'Change restored.');
  };

  typeSelect.addEventListener('change', () => {
    const nextType = typeSelect.value as EditableDiagramType;
    if (nextType === activeDiagramType) return;
    if (value !== templates[activeDiagramType]
      && !container.ownerDocument.defaultView?.confirm('Changing diagram type replaces the current source. Continue?')) {
      typeSelect.value = activeDiagramType;
      return;
    }
    activeDiagramType = nextType;
    zoom = 1;
    commitValue(templates[nextType], true);
  });

  let spaceDown = false;
  let panStart: { x: number; y: number; left: number; top: number } | undefined;
  let hoveredElement: Element | null = null;
  preview.addEventListener('pointermove', (event) => {
    hoveredElement = event.target instanceof Element ? event.target.closest('g.node, g.cluster, g.edgePath, g.edgeLabel, g.classGroup, g.statediagram-state, path.relationshipLine, path.transition') : null;
  });
  preview.addEventListener('pointerleave', () => { hoveredElement = null; });
  root.addEventListener('keydown', (event) => {
    if ((event.key !== 'Delete' && event.key !== 'Backspace') || editDialog.open || !hoveredElement
      || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      || event.target instanceof HTMLSelectElement || !preview.contains(hoveredElement)) return;
    hoveredElement.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const removeButton = editFields.querySelector<HTMLButtonElement>('button[aria-label^="Delete "]');
    if (!removeButton || !currentSelection) return;
    event.preventDefault();
    event.stopPropagation();
    removeButton.click();
  }, true);
  root.addEventListener('keydown', (event) => {
    if (editDialog.open) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        dialogApply.click();
      }
      return;
    }
    if (event.code === 'Space' && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement)) {
      spaceDown = true;
      previewStage.classList.add('mve-panning');
      event.preventDefault();
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && !event.defaultPrevented
      && !(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement)
      && !(event.target instanceof HTMLSelectElement) && currentSelection) {
      const removeButton = editFields.querySelector<HTMLButtonElement>('button[aria-label^="Delete "]');
      if (removeButton) {
        event.preventDefault();
        removeButton.click();
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void save();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      restoreHistory(event.shiftKey ? 1 : -1);
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      restoreHistory(1);
    }
  });
  root.addEventListener('keyup', (event) => {
    if (event.code === 'Space') { spaceDown = false; panStart = undefined; previewStage.classList.remove('mve-panning'); }
  });
  previewStage.addEventListener('pointerdown', (event) => {
    if (!spaceDown) return;
    panStart = { x: event.clientX, y: event.clientY, left: previewStage.scrollLeft, top: previewStage.scrollTop };
    previewStage.setPointerCapture?.(event.pointerId);
  });
  previewStage.addEventListener('pointermove', (event) => {
    if (!panStart) return;
    previewStage.scrollLeft = panStart.left - (event.clientX - panStart.x);
    previewStage.scrollTop = panStart.top - (event.clientY - panStart.y);
  });
  previewStage.addEventListener('pointerup', () => { panStart = undefined; });
  previewStage.addEventListener('wheel', (event) => {
    event.preventDefault();
    zoom = Math.max(0.2, Math.min(3, zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
    updateZoom();
  }, { passive: false });
  previewStage.addEventListener('dragover', (event) => {
    if (event.dataTransfer?.types.includes('application/x-mve-source-palette')) event.preventDefault();
    previewStage.classList.add('mve-drop-ready');
    previewStage.querySelector('.mve-drop-target')?.classList.remove('mve-drop-target');
    const target = event.target instanceof Element ? event.target.closest('g.node, g.cluster, g.classGroup, g.statediagram-state') : null;
    if (target && previewStage.contains(target)) target.classList.add('mve-drop-target');
  });
  previewStage.addEventListener('drop', (event) => {
    previewStage.classList.remove('mve-drop-ready');
    previewStage.querySelector('.mve-drop-target')?.classList.remove('mve-drop-target');
    const snippet = event.dataTransfer?.getData('application/x-mve-source-palette');
    if (!snippet) return;
    event.preventDefault();
    const entry = paletteCatalog[activeDiagramType]?.find((candidate) => candidate.snippet === snippet);
    if (entry) commitValue(appendPaletteEntry(value, activeDiagramType, entry), true);
  });
  palettePanel.addEventListener('dragstart', (event) => {
    if (event.target instanceof HTMLElement) event.target.classList.add('mve-dragging');
  });
  palettePanel.addEventListener('dragend', () => {
    palettePanel.querySelector('.mve-dragging')?.classList.remove('mve-dragging');
    previewStage.classList.remove('mve-drop-ready');
    previewStage.querySelector('.mve-drop-target')?.classList.remove('mve-drop-target');
  });
  preview.addEventListener('dblclick', openSelectionEditor);

  source.addEventListener('input', handleInput);
  scheduleRender();

  return {
    getValue(): string {
      return value;
    },
    setValue(nextValue: string): void {
      if (destroyed) throw new DestroyedEditorError();
      if (typeof nextValue !== 'string') throw new TypeError('value must be a string.');
      commitValue(nextValue, false);
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      renderRevision++;
      if (renderTimer !== undefined) clearTimeout(renderTimer);
      renderTimer = undefined;
      unmountDiagramAdapter();
      source.removeEventListener('input', handleInput);
      root.remove();
    },
  };
}
