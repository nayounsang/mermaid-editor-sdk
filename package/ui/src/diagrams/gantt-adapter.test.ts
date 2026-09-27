import { describe, expect, it } from 'vitest';
import { SourceDocument } from '@mermaid-editor/headless';
import { ganttAdapter } from './gantt-adapter';
import type { DiagramAdapterContext } from './adapter';

function makeContext(source: string): { context: DiagramAdapterContext; getSource: () => string } {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = '<svg></svg>';
  const svg = canvas.querySelector('svg')!;
  let value = source;
  const context: DiagramAdapterContext = {
    diagramType: 'gantt',
    toolbar,
    canvas,
    svg,
    sourceDocument: new SourceDocument(value, 'gantt'),
    applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'gantt')); return true; },
    setSelection() {},
  };
  return { context, getSource: () => value };
}

describe('Gantt adapter', () => {
  it('shows structure and task tools and appends the selected source item', () => {
    const source = 'gantt\n    dateFormat YYYY-MM-DD\n    section Build\n';
    const fixture = makeContext(source);
    const cleanup = ganttAdapter.mount(fixture.context);

    expect(fixture.context.toolbar.querySelectorAll('.mve-gantt-item')).toHaveLength(9);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add section"]')!.click();
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add task"]')!.click();
    expect(fixture.getSource()).toBe(`${source}    section Phase name\n    Task name :mveTask1, 5d\n`);

    cleanup();
    expect(fixture.context.toolbar.childNodes).toHaveLength(0);
  });

  it('accepts a drag from the palette and ignores unknown payloads', () => {
    const fixture = makeContext('gantt\n    section Build\n');
    const cleanup = ganttAdapter.mount(fixture.context);
    const button = fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add milestone"]')!;
    let payload = '';
    const transfer = {
      types: ['application/x-mve-gantt-palette'],
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
    expect(fixture.getSource()).toContain('Milestone :milestone, 0d');

    const beforeUnknown = fixture.getSource();
    const unknownDrop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(unknownDrop, 'dataTransfer', {
      value: { types: ['application/x-mve-gantt-palette'], getData: () => 'unknown' },
    });
    fixture.context.svg.dispatchEvent(unknownDrop);
    expect(fixture.getSource()).toBe(beforeUnknown);
    cleanup();
  });
});
