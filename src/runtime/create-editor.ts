import mermaid from 'mermaid';
import { classifyDiagram, withParseResult, withPreviewResult } from '../diagrams/capability';
import type { EditorError, MermaidVisualEditor, MermaidVisualEditorOptions } from './types';
import { DestroyedEditorError } from './types';

let mermaidInitialized = false;
let nextRenderId = 0;
const previewDebounceMs = 120;

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

  initializeMermaid();

  let value = initialValue;
  let destroyed = false;
  let renderRevision = 0;
  let renderTimer: ReturnType<typeof setTimeout> | undefined;

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

  const preview = container.ownerDocument.createElement('div');
  preview.className = 'mve-preview';
  preview.setAttribute('aria-label', 'Mermaid preview');

  root.append(status, source, preview);
  container.appendChild(root);

  const scheduleRender = (): void => {
    if (renderTimer !== undefined) clearTimeout(renderTimer);
    const revision = ++renderRevision;
    renderTimer = setTimeout(() => {
      renderTimer = undefined;
      void render(revision);
    }, previewDebounceMs);
  };

  const render = async (revision: number): Promise<void> => {
    if (destroyed || revision !== renderRevision) return;
    const currentValue = value;
    let capability = classifyDiagram(undefined);
    status.dataset.state = 'loading';
    status.textContent = capability.diagramType === 'unknown'
      ? 'Rendering Mermaid preview…'
      : `Rendering ${capability.diagramType} preview…`;

    if (!currentValue.trim()) {
      preview.replaceChildren();
      status.dataset.state = 'empty';
      status.textContent = 'Enter Mermaid source to see a preview.';
      return;
    }

    try {
      await mermaid.parse(currentValue);
      if (destroyed || revision !== renderRevision) return;
      capability = withParseResult(capability, true);
    } catch (cause) {
      if (destroyed || revision !== renderRevision) return;
      preview.replaceChildren();
      status.dataset.state = 'error';
      status.textContent = 'Mermaid source has a syntax error.';
      notifyError(onError, {
        code: 'parse',
        message: cause instanceof Error ? cause.message : 'Unknown Mermaid parse error.',
        cause,
      });
      return;
    }

    try {
      capability = classifyDiagram(mermaid.detectType(currentValue));
      capability = withParseResult(capability, true);
    } catch {
      // Parsing already succeeded; a missing detector should not turn valid source into a parse error.
    }

    try {
      const result = await mermaid.render(`mve-diagram-${++nextRenderId}`, currentValue);
      if (destroyed || revision !== renderRevision) return;
      capability = withPreviewResult(capability, true);
      preview.innerHTML = result.svg;
      result.bindFunctions?.(preview);
      status.dataset.state = 'ready';
      status.textContent = `${capability.diagramType === 'unsupported' ? 'This diagram type' : capability.diagramType} preview is ready; source editing is available.`;
    } catch (cause) {
      if (destroyed || revision !== renderRevision) return;
      preview.replaceChildren();
      status.dataset.state = 'error';
      status.textContent = 'Mermaid preview could not be rendered.';
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
    if (notify && onChange) {
      try {
        onChange(nextValue);
      } catch (callbackError) {
        reportCallbackFailure(callbackError);
      }
    }
    if (!destroyed) scheduleRender();
  };

  const handleInput = (): void => {
    if (destroyed) return;
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
      commitValue(nextValue, false);
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      renderRevision++;
      if (renderTimer !== undefined) clearTimeout(renderTimer);
      renderTimer = undefined;
      source.removeEventListener('input', handleInput);
      root.remove();
    },
  };
}
