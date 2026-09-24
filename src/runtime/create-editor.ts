import mermaid from 'mermaid';
import { getDiagramAdapter } from '../diagrams/adapter';
import { registerBuiltInAdapters } from '../diagrams/register-built-in-adapters';
import { classifyDiagram, withParseResult, withPreviewResult } from '../diagrams/capability';
import type { DiagramType } from '../diagrams/capability';
import type { AdapterDiagramType, DiagramAdapterContext } from '../diagrams/adapter';
import { SourceDocument } from '../source/source-document';
import type { EditorError, EditorSelection, MermaidVisualEditor, MermaidVisualEditorOptions } from './types';
import { DestroyedEditorError } from './types';

let mermaidInitialized = false;
let nextRenderId = 0;
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

function initializeMermaid(): void {
  if (mermaidInitialized) return;
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
  mermaidInitialized = true;
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
  if (typeof initialValue !== 'string') throw new TypeError('options.value must be a string.');
  for (const [name, callback] of [
    ['onChange', onChange],
    ['onSelectionChange', onSelectionChange],
    ['onError', onError],
  ] as const) {
    if (callback !== undefined && typeof callback !== 'function') {
      throw new TypeError(`options.${name} must be a function when provided.`);
    }
  }

  registerBuiltInAdapters();
  initializeMermaid();

  let value = initialValue;
  let destroyed = false;
  let renderRevision = 0;
  let renderTimer: ReturnType<typeof setTimeout> | undefined;
  let currentSelection: EditorSelection | null = null;
  let selectionAfterRender: EditorSelection | null | undefined;
  let focusSelectionAfterRender = false;
  let adapterCleanup: (() => void) | undefined;
  let adapterIsActive = false;

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

  const workspace = container.ownerDocument.createElement('div');
  workspace.className = 'mve-workspace';

  const gui = container.ownerDocument.createElement('section');
  gui.className = 'mve-gui';

  const toolbar = container.ownerDocument.createElement('div');
  toolbar.className = 'mve-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Diagram tools');
  toolbar.hidden = true;

  const preview = container.ownerDocument.createElement('div');
  preview.className = 'mve-preview';
  preview.setAttribute('aria-label', 'Mermaid preview');
  preview.setAttribute('aria-busy', 'false');
  preview.setAttribute('role', 'region');

  const sourcePanel = container.ownerDocument.createElement('section');
  sourcePanel.className = 'mve-source-panel';
  sourcePanel.setAttribute('aria-label', 'Mermaid source editor');

  gui.append(toolbar, preview);
  sourcePanel.append(source);
  workspace.append(gui, sourcePanel);
  root.append(status, workspace);
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
    currentSelection = snapshot;
    publishSelection(snapshot);
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
      setStatus('empty', 'Enter Mermaid source to see a preview.');
      return;
    }

    try {
      await mermaid.parse(currentValue);
      if (destroyed || revision !== renderRevision) return;
      capability = withParseResult(capability, true);
    } catch (cause) {
      if (destroyed || revision !== renderRevision) return;
      preview.replaceChildren();
      setStatus('error', 'Mermaid source has a syntax error. Source editing is available.', 'parse');
      notifyError(onError, {
        code: 'parse',
        message: cause instanceof Error ? cause.message : 'Unknown Mermaid parse error.',
        cause,
      });
      return;
    }

    try {
      const result = await mermaid.render(`mve-diagram-${++nextRenderId}`, currentValue);
      if (destroyed || revision !== renderRevision) return;
      capability = classifyDiagram(result.diagramType);
      capability = withParseResult(capability, true);
      capability = withPreviewResult(capability, true);
      preview.innerHTML = result.svg;
      result.bindFunctions?.(preview);
      if (isAdapterDiagramType(capability.diagramType)) {
        const initialSelection = selectionAfterRender;
        const focusInitialSelection = focusSelectionAfterRender;
        selectionAfterRender = undefined;
        focusSelectionAfterRender = false;
        const mounted = mountDiagramAdapter(capability.diagramType, currentValue, revision, initialSelection, focusInitialSelection);
        if (destroyed || revision !== renderRevision) return;
        if (mounted) capability = { ...capability, editor: 'visual' };
      }
      if (capability.diagramType === 'unsupported') {
        setStatus('unsupported', 'This Mermaid diagram type is not visually supported. Preview and source editing are available.');
      } else if (capability.diagramType === 'unknown') {
        setStatus('unknown', 'Mermaid preview is ready, but the diagram type could not be identified. Source editing is available.');
      } else if (capability.editor === 'source-only') {
        setStatus('source-only', `${capability.diagramType} preview is ready. Visual editing is unavailable; source editing is available.`);
      } else {
        setStatus('ready', `${capability.diagramType} preview is ready.`);
      }
    } catch (cause) {
      if (destroyed || revision !== renderRevision) return;
      preview.replaceChildren();
      setStatus('error', 'Mermaid preview could not be rendered. Source editing is available.', 'render');
      notifyError(onError, {
        code: 'render',
        message: cause instanceof Error ? cause.message : 'Unknown Mermaid rendering error.',
        cause,
      });
    }
  };

  const commitValue = (nextValue: string, notify: boolean): void => {
    if (nextValue === value) return;
    value = nextValue;
    source.value = nextValue;
    const hadSelection = currentSelection !== null;
    currentSelection = null;
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
    initialSelection?: EditorSelection | null,
    focusInitialSelection = false,
  ): boolean => {
    const adapter = getDiagramAdapter(diagramType);
    const svg = preview.querySelector('svg');
    if (!adapter || !svg) return false;

    const context: DiagramAdapterContext = {
      diagramType,
      toolbar,
      canvas: preview,
      svg,
      sourceDocument: new SourceDocument(sourceValue, diagramType),
      initialSelection,
      focusInitialSelection,
      applySourceMutation(mutate, selectionAfterMutation, focusSelectionAfterMutation): boolean {
        if (destroyed || !adapterIsActive || revision !== renderRevision) return false;
        try {
          if (typeof mutate !== 'function') throw new TypeError('Source mutation must be a function.');
          const nextSource = mutate(new SourceDocument(value, diagramType));
          if (typeof nextSource !== 'string') throw new TypeError('Source mutation must return a string.');
          selectionAfterRender = nextSource === value ? undefined : selectionAfterMutation;
          focusSelectionAfterRender = nextSource !== value && Boolean(focusSelectionAfterMutation);
          commitValue(nextSource, true);
          return true;
        } catch (cause) {
          notifyError(onError, {
            code: 'mutation',
            message: cause instanceof Error ? cause.message : 'Mermaid source mutation failed.',
            cause,
          });
          return false;
        }
      },
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
        }
        return false;
      }
      adapterCleanup = () => {
        adapterIsActive = false;
        cleanup();
      };
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
    selectionAfterRender = undefined;
    focusSelectionAfterRender = false;
    commitValue(preserveLineEndingStyle(source.value, value), true);
  };

  source.addEventListener('input', handleInput);
  scheduleRender();

  return {
    getValue(): string {
      return value;
    },
    setValue(nextValue: string): void {
      if (destroyed) throw new DestroyedEditorError();
      if (typeof nextValue !== 'string') throw new TypeError('value must be a string.');
      selectionAfterRender = undefined;
      focusSelectionAfterRender = false;
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
