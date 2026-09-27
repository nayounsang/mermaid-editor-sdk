import { describe, expect, it } from 'vitest';
import { SourceDocument } from '@mermaid-editor/headless';
import { journeyAdapter } from './journey-adapter';
import { getDiagramAdapter, type DiagramAdapterContext } from './adapter';
import { registerBuiltInAdapters } from './register-built-in-adapters';

function mount(source = 'journey\n') {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = '<svg></svg>';
  const svg = canvas.querySelector('svg')!;
  let value = source;
  const context: DiagramAdapterContext = {
    diagramType: 'journey', toolbar, canvas, svg, sourceDocument: new SourceDocument(value, 'journey'),
    applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'journey')); return true; },
    setSelection() {},
  };
  const cleanup = journeyAdapter.mount(context);
  return { toolbar, svg, cleanup, getSource: () => value };
}

function drop(svg: SVGSVGElement, id: string): Event {
  const event = new Event('drop', { cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { getData: () => id } });
  svg.dispatchEvent(event);
  return event;
}

describe('Journey adapter', () => {
  it('registers the Journey palette for runtime rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('journey')).toBe(journeyAdapter);
  });

  it('lets the user add a section and a multi-actor task', () => {
    const editor = mount();
    editor.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add section"]')!.click();
    editor.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add multi-actor"]')!.click();
    expect(editor.getSource()).toBe('journey\n    section Phase\n    Task name: 3: User, System\n');
    editor.cleanup();
  });

  it('uses the palette drag payload to insert the dropped task', () => {
    const editor = mount();
    const data = new Map<string, string>();
    const transfer = { setData: (key: string, value: string) => data.set(key, value), getData: (key: string) => data.get(key), effectAllowed: '' };
    const start = new Event('dragstart');
    Object.defineProperty(start, 'dataTransfer', { value: transfer });
    editor.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add task"]')!.dispatchEvent(start);
    const event = new Event('drop', { cancelable: true });
    Object.defineProperty(event, 'dataTransfer', { value: transfer });
    editor.svg.dispatchEvent(event);
    expect(editor.getSource()).toBe('journey\n    Task name: 5: Actor\n');
    expect(event.defaultPrevented).toBe(true);
    editor.cleanup();
  });

  it('ignores an unknown drop payload', () => {
    const editor = mount();
    expect(drop(editor.svg, 'unknown').defaultPrevented).toBe(false);
    expect(editor.getSource()).toBe('journey\n');
    editor.cleanup();
  });

  it('removes tools and prevents retained controls or drops from editing after cleanup', () => {
    const editor = mount();
    const button = editor.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add task"]')!;
    editor.cleanup();
    button.click();
    drop(editor.svg, 'task');
    expect(editor.toolbar.childNodes).toHaveLength(0);
    expect(editor.getSource()).toBe('journey\n');
  });
});
