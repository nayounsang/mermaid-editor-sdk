import { describe, expect, it } from 'vitest';
import { SourceDocument } from '../source/source-document';
import { getDiagramAdapter, type DiagramAdapterContext } from './adapter';
import { registerBuiltInAdapters } from './register-built-in-adapters';
import { timelineAdapter } from './timeline-adapter';

describe('Timeline adapter', () => {
  it('registers the palette for rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('timeline')).toBe(timelineAdapter);
  });

  it('adds an event through the mounted palette and disposes the toolbar', () => {
    let value = 'timeline\n    section 2020s\n        2024 : Start\n';
    const toolbar = document.createElement('div');
    const canvas = document.createElement('div');
    canvas.innerHTML = '<svg></svg>';
    const context: DiagramAdapterContext = {
      diagramType: 'timeline', toolbar, canvas, svg: canvas.querySelector('svg')!,
      sourceDocument: new SourceDocument(value, 'timeline'),
      applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'timeline')); return true; },
      setSelection() {},
    };
    const cleanup = timelineAdapter.mount(context);
    toolbar.querySelector<HTMLButtonElement>('[aria-label="Add event"]')!.click();
    expect(value).toBe(`${'timeline\n    section 2020s\n        2024 : Start\n'}        2026 : Event description\n`);
    cleanup();
    expect(toolbar.childNodes).toHaveLength(0);
  });
});
