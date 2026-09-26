import { describe, expect, it } from 'vitest';
import { SourceDocument } from '../source/source-document';
import { getDiagramAdapter, type DiagramAdapterContext } from './adapter';
import { mindmapAdapter } from './mindmap-adapter';
import { registerBuiltInAdapters } from './register-built-in-adapters';

describe('Mindmap adapter', () => {
  it('registers its node palette for rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('mindmap')).toBe(mindmapAdapter);
  });

  it('adds a circle root then a square child through the palette', () => {
    let value = 'mindmap\n';
    const toolbar = document.createElement('div');
    const canvas = document.createElement('div');
    canvas.innerHTML = '<svg></svg>';
    const context: DiagramAdapterContext = {
      diagramType: 'mindmap', toolbar, canvas, svg: canvas.querySelector('svg')!,
      sourceDocument: new SourceDocument(value, 'mindmap'),
      applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'mindmap')); return true; },
      setSelection() {},
    };
    const cleanup = mindmapAdapter.mount(context);
    toolbar.querySelector<HTMLButtonElement>('[aria-label="Add root (circle)"]')!.click();
    toolbar.querySelector<HTMLButtonElement>('[aria-label="Add square node"]')!.click();
    expect(value).toBe('mindmap\n  root((Title))\n    [Square]\n');
    cleanup();
    expect(toolbar.childNodes).toHaveLength(0);
  });
});
