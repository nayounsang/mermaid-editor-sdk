import { describe, expect, it } from 'vitest';
import { SourceDocument } from '@mermaid-editor/headless';
import { pieAdapter } from './pie-adapter';
import type { DiagramAdapterContext } from './adapter';

function makeContext(source: string): { context: DiagramAdapterContext; getSource: () => string } {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = '<svg></svg>';
  const svg = canvas.querySelector('svg')!;
  let value = source;
  const context: DiagramAdapterContext = {
    diagramType: 'pie', toolbar, canvas, svg, sourceDocument: new SourceDocument(value, 'pie'),
    applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'pie')); return true; },
    setSelection() {},
  };
  return { context, getSource: () => value };
}

describe('Pie adapter', () => {
  it('offers title and slice tools and appends the selected slice', () => {
    const fixture = makeContext('pie title Browser usage\n    "Chrome" : 65\n');
    const cleanup = pieAdapter.mount(fixture.context);
    expect(fixture.context.toolbar.querySelectorAll('.mve-pie-item')).toHaveLength(2);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add slice"]')!.click();
    expect(fixture.getSource()).toBe('pie title Browser usage\n    "Chrome" : 65\n    "Label" : 25\n');
    cleanup();
    expect(fixture.context.toolbar.childNodes).toHaveLength(0);
  });

  it('accepts palette drops and ignores unknown payloads', () => {
    const fixture = makeContext('pie\n');
    const cleanup = pieAdapter.mount(fixture.context);
    const button = fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add slice"]')!;
    let payload = '';
    const transfer = {
      types: ['application/x-mve-pie-palette'], effectAllowed: 'copy',
      setData: (_type: string, value: string) => { payload = value; }, getData: () => payload,
    };
    const dragStart = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStart, 'dataTransfer', { value: transfer });
    button.dispatchEvent(dragStart);
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: transfer });
    fixture.context.svg.dispatchEvent(drop);
    expect(fixture.getSource()).toContain('"Label" : 25');

    const beforeUnknown = fixture.getSource();
    const unknownDrop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(unknownDrop, 'dataTransfer', {
      value: { types: ['application/x-mve-pie-palette'], getData: () => 'unknown' },
    });
    fixture.context.svg.dispatchEvent(unknownDrop);
    expect(fixture.getSource()).toBe(beforeUnknown);
    cleanup();
  });
});
