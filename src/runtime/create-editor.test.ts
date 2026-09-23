import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(async () => ({ config: {} })),
  detectType: vi.fn(() => 'flowchart-v2'),
  render: vi.fn(async () => ({ svg: '<svg data-rendered="yes"></svg>' })),
}));

vi.mock('mermaid', () => ({ default: mermaidMock }));

import { createMermaidVisualEditor } from './create-editor';

describe('createMermaidVisualEditor', () => {
  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    mermaidMock.parse.mockResolvedValue({ config: {} });
    mermaidMock.render.mockResolvedValue({ svg: '<svg data-rendered="yes"></svg>' });
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

  it('reports parser failures while retaining the source for correction', async () => {
    mermaidMock.parse.mockRejectedValueOnce(new Error('invalid source'));
    const container = document.createElement('div');
    const onError = vi.fn();
    const editor = createMermaidVisualEditor(container, { value: 'invalid', onError });
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'parse' }));
    expect(editor.getValue()).toBe('invalid');
    expect(container.querySelector('.mve-status')?.textContent).toContain('syntax error');
    editor.destroy();
  });

  it('renders the detected diagram and reports source-only editing separately', async () => {
    const container = document.createElement('div');
    const editor = createMermaidVisualEditor(container, { value: 'flowchart LR\nA-->B' });
    await vi.waitFor(() => expect(mermaidMock.render).toHaveBeenCalledOnce());

    expect(mermaidMock.detectType).toHaveBeenCalledWith('flowchart LR\nA-->B');
    expect(container.querySelector('.mve-preview svg')?.getAttribute('data-rendered')).toBe('yes');
    expect(container.querySelector('.mve-status')?.textContent)
      .toBe('flowchart preview is ready; source editing is available.');
    editor.destroy();
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
