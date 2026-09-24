import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(async () => ({ config: {} })),
  render: vi.fn(async () => ({ svg: '<svg data-rendered="yes"></svg>', diagramType: 'flowchart-v2' })),
}));

vi.mock('mermaid', () => ({ default: mermaidMock }));

import { createMermaidVisualEditor } from './create-editor';
import { createMermaidVisualEditor as createFromPublicEntry } from '../index';
import { registerDiagramAdapter, type DiagramAdapterContext } from '../diagrams/adapter';

describe('createMermaidVisualEditor', () => {
  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    vi.clearAllMocks();
    mermaidMock.parse.mockResolvedValue({ config: {} });
    mermaidMock.render.mockResolvedValue({
      svg: '<svg data-rendered="yes"></svg>',
      diagramType: 'flowchart-v2',
    });
  });

  it('mounts without replacing host children and preserves the initial source', () => {
    const container = document.createElement('div');
    const child = document.createElement('span');
    container.append(child);
    const onChange = vi.fn();
    const editor = createMermaidVisualEditor(container, { value: 'flowchart LR\nA-->B', onChange });

    expect(editor.getValue()).toBe('flowchart LR\nA-->B');
    expect(container.firstChild).toBe(child);
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('flowchart LR\nA-->B');
    expect(onChange).not.toHaveBeenCalled();
    editor.destroy();
  });

  it('synchronizes user input synchronously and external updates without callbacks', () => {
    const container = document.createElement('div');
    const onChange = vi.fn();
    const editor = createMermaidVisualEditor(container, { value: 'A[old]', onChange });
    const source = container.querySelector('textarea') as HTMLTextAreaElement;

    source.value = 'A[new]';
    source.dispatchEvent(new Event('input', { bubbles: true }));
    expect(editor.getValue()).toBe('A[new]');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('A[new]');

    editor.setValue('B[external]');
    expect(editor.getValue()).toBe('B[external]');
    expect(source.value).toBe('B[external]');
    expect(onChange).toHaveBeenCalledOnce();
    editor.destroy();
  });

  it('does not notify the host when setValue receives the current source', () => {
    const container = document.createElement('div');
    const onChange = vi.fn();
    const editor = createMermaidVisualEditor(container, { value: 'A[stable]', onChange });

    editor.setValue('A[stable]');

    expect(editor.getValue()).toBe('A[stable]');
    expect(onChange).not.toHaveBeenCalled();
    editor.destroy();
  });

  it('lets onChange read the edited source and apply a host update without echoing it', () => {
    const container = document.createElement('div');
    const editorRef: { current?: ReturnType<typeof createMermaidVisualEditor> } = {};
    let valueObservedByCallback: string | undefined;
    const onChange = vi.fn(() => {
      valueObservedByCallback = editorRef.current?.getValue();
      editorRef.current?.setValue('A[host-normalized]');
    });
    const editor = createMermaidVisualEditor(container, { value: 'A[initial]', onChange });
    editorRef.current = editor;
    const source = container.querySelector('textarea') as HTMLTextAreaElement;

    source.value = 'A[user-edited]';
    source.dispatchEvent(new Event('input', { bubbles: true }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('A[user-edited]');
    expect(valueObservedByCallback).toBe('A[user-edited]');
    expect(editor.getValue()).toBe('A[host-normalized]');
    expect(source.value).toBe('A[host-normalized]');
    editor.destroy();
  });

  it('preserves the current source line ending style when textarea input changes', () => {
    const container = document.createElement('div');
    const initialValue = 'flowchart LR\r\nA[old]\r\nB[keep]';
    const onChange = vi.fn();
    const editor = createMermaidVisualEditor(container, { value: initialValue, onChange });
    const source = container.querySelector('textarea') as HTMLTextAreaElement;
    source.value = 'flowchart LR\nA[new]\nB[keep]';
    source.dispatchEvent(new Event('input', { bubbles: true }));

    const expected = 'flowchart LR\r\nA[new]\r\nB[keep]';
    expect(editor.getValue()).toBe(expected);
    expect(onChange).toHaveBeenCalledWith(expected);
    editor.destroy();
  });

  it('does not schedule a preview after an onChange callback destroys the editor', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const editorRef: { current?: ReturnType<typeof createMermaidVisualEditor> } = {};
    const editor = createMermaidVisualEditor(container, {
      value: 'A[old]',
      onChange: () => editorRef.current?.destroy(),
    });
    editorRef.current = editor;
    const source = container.querySelector('textarea') as HTMLTextAreaElement;
    source.value = 'A[new]';
    source.dispatchEvent(new Event('input', { bubbles: true }));

    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it('keeps the last value readable after idempotent destroy and rejects later mutation', () => {
    const container = document.createElement('div');
    const hostChild = document.createElement('p');
    container.append(hostChild);
    const editor = createMermaidVisualEditor(container, { value: 'pie' });
    editor.destroy();
    editor.destroy();

    expect(editor.getValue()).toBe('pie');
    expect([...container.childNodes]).toEqual([hostChild]);
    expect(() => editor.setValue('gantt')).toThrowError(expect.objectContaining({ name: 'DestroyedEditorError' }));
  });

  it('validates arguments before modifying the container', () => {
    const container = document.createElement('div');
    const child = document.createElement('span');
    container.append(child);
    expect(() => createMermaidVisualEditor(container, { value: 1 } as never)).toThrow(TypeError);
    expect(() => createMermaidVisualEditor(container, { value: 'ok', onChange: 1 } as never)).toThrow(TypeError);
    expect([...container.childNodes]).toEqual([child]);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expect(() => createMermaidVisualEditor(svg as never, { value: 'ok' })).toThrow(TypeError);
  });

  it('marks parse errors and keeps source editing available for correction', async () => {
    mermaidMock.parse.mockRejectedValueOnce(new Error('invalid source'));
    const container = document.createElement('div');
    const onError = vi.fn();
    const editor = createMermaidVisualEditor(container, { value: 'invalid', onError });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'parse' }));
    expect(editor.getValue()).toBe('invalid');
    const status = container.querySelector<HTMLElement>('.mve-status');
    expect(status?.dataset.state).toBe('error');
    expect(status?.dataset.errorCode).toBe('parse');
    expect(status?.textContent).toContain('syntax error');
    expect(status?.textContent).toContain('Source editing is available.');
    expect(container.querySelector('textarea')).not.toBeNull();
    editor.destroy();
  });

  it('renders a known diagram and mounts sequence editing tools', async () => {
    mermaidMock.render.mockResolvedValueOnce({ svg: '<svg data-rendered="yes"></svg>', diagramType: 'sequence' });
    const container = document.createElement('div');
    const editor = createMermaidVisualEditor(container, { value: 'sequenceDiagram\nA->>B: hello' });
    await vi.waitFor(() => expect(container.querySelector('.mve-sequence-item')).not.toBeNull());

    expect(container.querySelector('.mve-preview svg')?.getAttribute('data-rendered')).toBe('yes');
    expect(container.querySelector<HTMLElement>('.mve-status')?.dataset.state).toBe('ready');
    expect(container.querySelector('.mve-status')?.textContent).toBe('sequence preview is ready.');
    container.querySelector<HTMLButtonElement>('[aria-label="Add message (sync)"]')!.click();
    expect(editor.getValue()).toBe('sequenceDiagram\nA->>B: hello\n    A->>B: message');
    editor.destroy();
  });

  it('registers the built-in Flowchart adapter from the package entry and edits selected nodes', async () => {
    mermaidMock.render.mockResolvedValueOnce({
      svg: '<svg><g class="node" id="flowchart-A-0"><rect></rect><g class="nodeLabel">Alpha</g></g></svg>',
      diagramType: 'flowchart-v2',
    });
    const container = document.createElement('div');
    const selections: unknown[] = [];
    const changes: string[] = [];
    const editor = createFromPublicEntry(container, {
      value: 'flowchart LR\nA[Alpha]',
      onSelectionChange: (selection) => selections.push(selection),
      onChange: (value) => changes.push(value),
    });
    await vi.waitFor(() => expect(container.querySelector('.mve-flowchart-palette')).not.toBeNull());

    container.querySelector('.mve-preview g.node')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(selections).toEqual([{ kind: 'node', diagramType: 'flowchart', id: 'A' }]);
    expect(container.querySelector('.mve-flowchart-selection')?.hasAttribute('hidden')).toBe(false);

    const label = container.querySelector<HTMLInputElement>('.mve-flowchart-selection input[aria-label="Label"]')!;
    label.value = 'Renamed';
    label.dispatchEvent(new Event('change', { bubbles: true }));

    expect(editor.getValue()).toBe('flowchart LR\nA[Renamed]');
    expect(changes).toEqual(['flowchart LR\nA[Renamed]']);
    editor.destroy();
  });

  it('labels a renderable diagram outside the supported set as unsupported', async () => {
    mermaidMock.render.mockResolvedValueOnce({
      svg: '<svg data-rendered="yes"></svg>',
      diagramType: 'architecture',
    });
    const container = document.createElement('div');
    const editor = createMermaidVisualEditor(container, { value: 'architecture-beta' });
    await vi.waitFor(() => expect(mermaidMock.render).toHaveBeenCalledOnce());

    expect(container.querySelector('.mve-preview svg')?.getAttribute('data-rendered')).toBe('yes');
    expect(container.querySelector<HTMLElement>('.mve-status')?.dataset.state).toBe('unsupported');
    expect(container.querySelector('.mve-status')?.textContent)
      .toBe('This Mermaid diagram type is not visually supported. Preview and source editing are available.');
    expect(container.querySelector('textarea')).not.toBeNull();
    editor.destroy();
  });

  it('marks renderer failures separately from parse errors while keeping source editable', async () => {
    mermaidMock.render.mockRejectedValueOnce(new Error('renderer failure'));
    const container = document.createElement('div');
    const onError = vi.fn();
    const editor = createMermaidVisualEditor(container, { value: 'flowchart LR\nA-->B', onError });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());

    const status = container.querySelector<HTMLElement>('.mve-status');
    expect(status?.dataset.state).toBe('error');
    expect(status?.dataset.errorCode).toBe('render');
    expect(status?.textContent).toContain('could not be rendered');
    expect(container.querySelector('textarea')).not.toBeNull();
    expect(container.querySelector('.mve-preview svg')).toBeNull();
    editor.destroy();
  });

  it('does not rewrite the pending status for each keystroke', () => {
    const container = document.createElement('div');
    const editor = createMermaidVisualEditor(container, { value: 'A[initial]' });
    const source = container.querySelector('textarea') as HTMLTextAreaElement;
    const status = container.querySelector('.mve-status');
    const preview = container.querySelector('.mve-preview');
    const observer = new MutationObserver(() => {});
    observer.observe(status!, { attributes: true, childList: true, characterData: true, subtree: true });
    observer.observe(preview!, { attributes: true, attributeFilter: ['aria-busy'] });

    source.value = 'A[first]';
    source.dispatchEvent(new Event('input', { bubbles: true }));
    source.value = 'A[second]';
    source.dispatchEvent(new Event('input', { bubbles: true }));

    expect(status?.textContent).toBe('Updating Mermaid preview…');
    expect(preview?.getAttribute('aria-busy')).toBe('true');
    expect(observer.takeRecords()).toHaveLength(0);
    observer.disconnect();
    editor.destroy();
  });

  it('mounts diagram adapters in the shared canvas and routes source and selection changes', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    let adapterContext: DiagramAdapterContext | undefined;
    const cleanup = vi.fn();
    const selection = vi.fn();
    const onChange = vi.fn();
    const unregister = registerDiagramAdapter({
      diagramType: 'flowchart',
      mount(context) {
        adapterContext = context;
        context.setSelection({ kind: 'node', diagramType: 'flowchart', id: 'A' });
        return cleanup;
      },
    });
    let editor: ReturnType<typeof createMermaidVisualEditor> | undefined;
    try {
      editor = createMermaidVisualEditor(container, {
        value: 'flowchart LR\nA[old]',
        onChange,
        onSelectionChange: selection,
      });
      await vi.advanceTimersByTimeAsync(120);

      expect(container.querySelector('.mve-toolbar')?.hasAttribute('hidden')).toBe(false);
      expect(container.querySelector('.mve-preview svg')).not.toBeNull();
      expect(adapterContext?.sourceDocument.source).toBe('flowchart LR\nA[old]');
      expect(selection).toHaveBeenCalledOnce();
      expect(Object.isFrozen(selection.mock.calls[0]?.[0])).toBe(true);

      adapterContext?.applySourceMutation((sourceDocument) => {
        const region = sourceDocument.findUniqueEditableStatement('A[old]');
        return sourceDocument.replaceStatement(region.start, region.end, 'A[new]');
      });

      expect(editor.getValue()).toBe('flowchart LR\nA[new]');
      expect(onChange).toHaveBeenCalledWith('flowchart LR\nA[new]');
      expect(selection).toHaveBeenLastCalledWith(null);
      expect(cleanup).toHaveBeenCalledOnce();
      expect(container.querySelector('.mve-toolbar')?.hasAttribute('hidden')).toBe(true);

      adapterContext?.setSelection({ kind: 'node', diagramType: 'flowchart', id: 'stale' });
      adapterContext?.applySourceMutation(() => 'flowchart LR\nB[stale]');
      expect(editor.getValue()).toBe('flowchart LR\nA[new]');
      expect(selection).toHaveBeenLastCalledWith(null);
      expect(onChange).toHaveBeenCalledOnce();
    } finally {
      editor?.destroy();
      unregister();
      vi.useRealTimers();
    }
  });

  it('keeps the common source and canvas shell available without an adapter', () => {
    const container = document.createElement('div');
    const editor = createMermaidVisualEditor(container, { value: 'A[plain]' });

    expect(container.querySelector('.mve-workspace')).not.toBeNull();
    expect(container.querySelector<HTMLTextAreaElement>('.mve-source-panel textarea')?.value).toBe('A[plain]');
    expect(container.querySelector('.mve-preview[role="region"]')).not.toBeNull();
    expect(container.querySelector('.mve-toolbar[role="toolbar"]')?.hasAttribute('hidden')).toBe(true);
    editor.destroy();
  });

  it('invalidates the old adapter selection before calling onChange', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    let adapterContext: DiagramAdapterContext | undefined;
    let mountCount = 0;
    const selections: Array<unknown> = [];
    let editor: ReturnType<typeof createMermaidVisualEditor> | undefined;
    const unregister = registerDiagramAdapter({
      diagramType: 'flowchart',
      mount(context) {
        adapterContext = context;
        mountCount++;
        context.setSelection({
          kind: 'node',
          diagramType: 'flowchart',
          id: mountCount === 1 ? 'A' : 'B',
        });
        return () => {};
      },
    });

    try {
      editor = createMermaidVisualEditor(container, {
        value: 'flowchart LR\nA[old]',
        onChange: () => adapterContext?.setSelection({ kind: 'node', diagramType: 'flowchart', id: 'B' }),
        onSelectionChange: (selection) => selections.push(selection),
      });
      await vi.advanceTimersByTimeAsync(120);
      adapterContext?.applySourceMutation((sourceDocument) => {
        const region = sourceDocument.findUniqueEditableStatement('A[old]');
        return sourceDocument.replaceStatement(region.start, region.end, 'A[new]');
      });

      expect(selections).toEqual([{ kind: 'node', diagramType: 'flowchart', id: 'A' }, null]);

      await vi.advanceTimersByTimeAsync(120);

      expect(selections).toEqual([
        { kind: 'node', diagramType: 'flowchart', id: 'A' },
        null,
        { kind: 'node', diagramType: 'flowchart', id: 'B' },
      ]);
    } finally {
      editor?.destroy();
      unregister();
      vi.useRealTimers();
    }
  });

  it('cleans up an adapter when its selection callback destroys the editor during mount', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const cleanup = vi.fn();
    let editor: ReturnType<typeof createMermaidVisualEditor> | undefined;
    const unregister = registerDiagramAdapter({
      diagramType: 'flowchart',
      mount(context) {
        context.setSelection({ kind: 'node', diagramType: 'flowchart', id: 'A' });
        return cleanup;
      },
    });

    try {
      editor = createMermaidVisualEditor(container, {
        value: 'flowchart LR\nA-->B',
        onSelectionChange: () => editor?.destroy(),
      });
      await vi.advanceTimersByTimeAsync(120);

      expect(container.querySelector('.mve-root')).toBeNull();
      expect(cleanup).toHaveBeenCalledOnce();
    } finally {
      editor?.destroy();
      unregister();
      vi.useRealTimers();
    }
  });

  it('cleans up a mounted adapter when the editor is destroyed', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const cleanup = vi.fn();
    const unregister = registerDiagramAdapter({
      diagramType: 'flowchart',
      mount() {
        return cleanup;
      },
    });
    let editor: ReturnType<typeof createMermaidVisualEditor> | undefined;

    try {
      editor = createMermaidVisualEditor(container, { value: 'flowchart LR\nA-->B' });
      await vi.advanceTimersByTimeAsync(120);
      expect(container.querySelector('.mve-toolbar')?.hasAttribute('hidden')).toBe(false);

      editor.destroy();

      expect(cleanup).toHaveBeenCalledOnce();
      expect(container.querySelector('.mve-root')).toBeNull();
    } finally {
      editor?.destroy();
      unregister();
      vi.useRealTimers();
    }
  });

  it('reports rejected adapter mutations without changing the source', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const onChange = vi.fn();
    const onError = vi.fn();
    let adapterContext: DiagramAdapterContext | undefined;
    const unregister = registerDiagramAdapter({
      diagramType: 'flowchart',
      mount(context) {
        adapterContext = context;
        return () => {};
      },
    });
    let editor: ReturnType<typeof createMermaidVisualEditor> | undefined;

    try {
      editor = createMermaidVisualEditor(container, {
        value: 'flowchart LR\nA[old]',
        onChange,
        onError,
      });
      await vi.advanceTimersByTimeAsync(120);
      adapterContext?.applySourceMutation((sourceDocument) => {
        const region = sourceDocument.findUniqueEditableStatement('not-present');
        return sourceDocument.replaceStatement(region.start, region.end, 'A[new]');
      });

      expect(editor.getValue()).toBe('flowchart LR\nA[old]');
      expect(onChange).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'mutation' }));
    } finally {
      editor?.destroy();
      unregister();
      vi.useRealTimers();
    }
  });

  it('does not render a stale source after a newer value arrives during parsing', async () => {
    vi.useFakeTimers();
    let finishParse!: () => void;
    mermaidMock.parse.mockImplementationOnce(() => new Promise((resolve) => {
      finishParse = () => resolve({ config: {} });
    }));
    const container = document.createElement('div');
    const editor = createMermaidVisualEditor(container, { value: 'A[old]' });
    await vi.advanceTimersByTimeAsync(120);
    editor.setValue('A[new]');
    finishParse();
    await Promise.resolve();
    expect(mermaidMock.render).not.toHaveBeenCalled();
    editor.destroy();
    vi.useRealTimers();
  });
});
