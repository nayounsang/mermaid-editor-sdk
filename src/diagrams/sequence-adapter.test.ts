import { afterEach, describe, expect, it, vi } from 'vitest';
import { SourceDocument } from '../source/source-document';
import { sequenceAdapter } from './sequence-adapter';
import type { DiagramAdapterContext } from './adapter';

function makeContext(source: string): { context: DiagramAdapterContext; getSource: () => string } {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = '<svg></svg>';
  const svg = canvas.querySelector('svg')!;
  let value = source;
  const context: DiagramAdapterContext = {
    diagramType: 'sequence',
    toolbar,
    canvas,
    svg,
    sourceDocument: new SourceDocument(value, 'sequence'),
    applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'sequence')); },
    setSelection: vi.fn(),
  };
  return { context, getSource: () => value };
}

afterEach(() => vi.restoreAllMocks());

describe('Sequence adapter', () => {
  it('shows all source-editing tools and inserts messages using declared participant references', () => {
    const source = 'sequenceDiagram\n    participant Browser\n    participant API\n    Browser->>API: original\n';
    const fixture = makeContext(source);
    const cleanup = sequenceAdapter.mount(fixture.context);

    expect(fixture.context.toolbar.querySelectorAll('.mve-sequence-item')).toHaveLength(12);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add message (sync)"]')!.click();

    expect(fixture.getSource()).toBe(`${source}    Browser->>API: message\n`);
    expect(fixture.context.svg.querySelectorAll('.mve-selected')).toHaveLength(0);
    cleanup();
    expect(fixture.context.toolbar.childNodes).toHaveLength(0);
  });

  it('inserts messages using implicit participant references already in the source', () => {
    const source = 'sequenceDiagram\n    Alice->>Bob: original\n';
    const fixture = makeContext(source);
    const cleanup = sequenceAdapter.mount(fixture.context);

    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add message (sync)"]')!.click();

    expect(fixture.getSource()).toBe(`${source}    Alice->>Bob: message\n`);
    cleanup();
  });

  it('accepts a drag from the palette', () => {
    const fixture = makeContext('sequenceDiagram\n    participant A\n    participant B\n');
    const cleanup = sequenceAdapter.mount(fixture.context);
    const button = fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add loop"]')!;
    let payload = '';
    const transfer = {
      types: ['application/x-mve-sequence-palette'],
      effectAllowed: 'copy',
      setData: (_type: string, value: string) => { payload = value; },
      getData: () => payload,
    };
    const dragStart = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStart, 'dataTransfer', { value: transfer });
    button.dispatchEvent(dragStart);

    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: transfer });
    fixture.context.svg.dispatchEvent(drop);
    expect(fixture.getSource()).toContain('loop every minute');
    expect(fixture.getSource()).toContain('    end\n');
    cleanup();
  });

  it('ignores unrecognized drag payloads', () => {
    const fixture = makeContext('sequenceDiagram\n    participant A\n    participant B\n');
    const cleanup = sequenceAdapter.mount(fixture.context);
    const beforeUnknownDrop = fixture.getSource();
    const unknownTransfer = { types: ['application/x-mve-sequence-palette'], getData: () => 'unknown' };
    const unknownDrop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(unknownDrop, 'dataTransfer', { value: unknownTransfer });
    fixture.context.svg.dispatchEvent(unknownDrop);
    expect(fixture.getSource()).toBe(beforeUnknownDrop);
    cleanup();
  });
});
