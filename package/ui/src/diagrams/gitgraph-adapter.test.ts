import { describe, expect, it } from 'vitest';
import { SourceDocument } from '@mermaid-editor-sdk/headless';
import { getDiagramAdapter, type DiagramAdapterContext } from './adapter';
import { gitgraphAdapter } from './gitgraph-adapter';
import { registerBuiltInAdapters } from './register-built-in-adapters';

describe('Gitgraph adapter', () => {
  it('registers the palette for rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('gitgraph')).toBe(gitgraphAdapter);
  });

  it('adds commits through the mounted palette and disposes its toolbar', () => {
    let value = 'gitGraph\n    commit id: "start"\n';
    const toolbar = document.createElement('div');
    const canvas = document.createElement('div');
    canvas.innerHTML = '<svg></svg>';
    const context: DiagramAdapterContext = {
      diagramType: 'gitgraph', toolbar, canvas, svg: canvas.querySelector('svg')!,
      sourceDocument: new SourceDocument(value, 'gitgraph'),
      applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'gitgraph')); return true; },
      setSelection() {},
    };
    const cleanup = gitgraphAdapter.mount(context);
    toolbar.querySelector<HTMLButtonElement>('[aria-label="Add tagged commit"]')!.click();
    expect(value).toBe('gitGraph\n    commit id: "start"\n    commit tag: "v1.0"\n');
    cleanup();
    expect(toolbar.childNodes).toHaveLength(0);
  });
});
