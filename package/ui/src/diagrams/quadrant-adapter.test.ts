import { describe, expect, it } from 'vitest';
import { SourceDocument } from '@mermaid-editor-sdk/headless';
import { quadrantAdapter } from './quadrant-adapter';
import { getDiagramAdapter, type DiagramAdapterContext } from './adapter';
import { registerBuiltInAdapters } from './register-built-in-adapters';

function mount() {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = '<svg></svg>';
  const svg = canvas.querySelector('svg')!;
  let value = 'quadrantChart\n';
  const context: DiagramAdapterContext = {
    diagramType: 'quadrant', toolbar, canvas, svg, sourceDocument: new SourceDocument(value, 'quadrant'),
    applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'quadrant')); return true; },
    setSelection() {},
  };
  const cleanup = quadrantAdapter.mount(context);
  return { toolbar, svg, cleanup, getSource: () => value };
}

function drop(svg: SVGSVGElement, id: string): Event {
  const event = new Event('drop', { cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { getData: () => id } });
  svg.dispatchEvent(event);
  return event;
}

describe('Quadrant adapter', () => {
  it('registers the Quadrant palette for runtime rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('quadrant')).toBe(quadrantAdapter);
  });

  it('inserts palette items on click and accepts palette drop payloads', () => {
    const editor = mount();
    editor.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add title"]')!.click();
    const event = drop(editor.svg, 'point');
    expect(editor.getSource()).toBe('quadrantChart\n    title Chart title\n    Label: [0.5, 0.5]\n');
    expect(event.defaultPrevented).toBe(true);
    editor.cleanup();
  });

  it('removes tools and prevents retained controls or drops from editing after cleanup', () => {
    const editor = mount();
    const button = editor.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add data point"]')!;
    editor.cleanup();
    button.click();
    drop(editor.svg, 'point');
    expect(editor.toolbar.childNodes).toHaveLength(0);
    expect(editor.getSource()).toBe('quadrantChart\n');
  });
});
