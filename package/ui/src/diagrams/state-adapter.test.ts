import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { SourceDocument } from '@mermaid-editor/headless';
import { stateAdapter } from './state-adapter';
import type { DiagramAdapterContext } from './adapter';

function makeContext(source: string, svgMarkup = '<g class="statediagram-state" id="state-A-0"></g><g class="statediagram-state" id="state-B-1"></g><path class="transition"></path>') {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = svgMarkup.trimStart().startsWith('<svg') ? svgMarkup : `<svg>${svgMarkup}</svg>`;
  const svg = canvas.querySelector('svg')!;
  let value = source;
  let selected: unknown;
  const context: DiagramAdapterContext = {
    diagramType: 'state', toolbar, canvas, svg, sourceDocument: new SourceDocument(value, 'state'),
    applySourceMutation(mutate) {
      try { value = mutate(new SourceDocument(value, 'state')); return true; }
      catch { return false; }
    },
    setSelection(selection) { selected = selection; },
  };
  return { context, getSource: () => value, selection: () => selected };
}

async function makeRenderedContext(source: string, id: string) {
  const getBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 40, height: 24 }),
  });
  try {
    mermaid.initialize({ startOnLoad: false });
    const rendered = await mermaid.render(id, source);
    return makeContext(source, rendered.svg);
  } finally {
    if (getBBox) Object.defineProperty(SVGElement.prototype, 'getBBox', getBBox);
    else delete (SVGElement.prototype as SVGElement & { getBBox?: () => DOMRect }).getBBox;
  }
}

describe('State adapter', () => {
  it('connects selected states and selects a rendered transition', () => {
    const fixture = makeContext('stateDiagram-v2\nA --> B : before\n');
    const cleanup = stateAdapter.mount(fixture.context);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Connect two states"]')!.click();
    fixture.context.svg.querySelector<SVGGElement>('#state-A-0')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.context.svg.querySelector<SVGGElement>('#state-B-1')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.getSource()).toBe('stateDiagram-v2\nA --> B : before\nA --> B\n');

    fixture.context.svg.querySelector<SVGPathElement>('.transition')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: 'A', target: 'B', occurrence: 0 });
    cleanup();
    expect(fixture.context.toolbar.childElementCount).toBe(0);
  });

  it('connects states by dragging between nodes', () => {
    const fixture = makeContext('stateDiagram-v2\nA --> B\n');
    const cleanup = stateAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('#state-A-0')!
      .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
    fixture.context.svg.querySelector<SVGGElement>('#state-B-1')!
      .dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));
    expect(fixture.getSource()).toBe('stateDiagram-v2\nA --> B\nA --> B\n');
    cleanup();
  });

  it('adds states from the toolbar and reports selection changes', () => {
    const fixture = makeContext('stateDiagram-v2\nA --> B\n');
    const cleanup = stateAdapter.mount(fixture.context);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add state"]')!.click();
    expect(fixture.getSource()).toContain('state State1');
    fixture.context.svg.querySelector<SVGGElement>('#state-A-0')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'state', id: 'A' });
    cleanup();
    expect(fixture.selection()).toBeNull();
  });

  it('reports null when the user clicks the empty canvas to clear a selection', () => {
    const fixture = makeContext('stateDiagram-v2\nA --> B\n');
    const cleanup = stateAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('#state-A-0')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'state', id: 'A' });
    fixture.context.svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toBeNull();
    cleanup();
  });

  it('exposes the state catalog and adds a composite state', () => {
    const fixture = makeContext('stateDiagram-v2\nA --> B\n');
    const cleanup = stateAdapter.mount(fixture.context);
    expect([...fixture.context.toolbar.querySelectorAll('.mve-palette-group h3')].map((heading) => heading.textContent))
      .toEqual(['States', 'Transitions', 'Notes']);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add composite state"]')!.click();
    expect(fixture.getSource()).toContain('state Composite1 {\n  Composite1Inner\n}');
    cleanup();
  });

  it('keeps state controls available when an existing style contains rgb colors', () => {
    const fixture = makeContext('stateDiagram-v2\nA --> B\nstyle A fill:rgb(255,0,0)\n');
    const cleanup = stateAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('#state-A-0')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'state', id: 'A' });
    expect(fixture.context.toolbar.querySelector<HTMLInputElement>('[aria-label="Fill color"]')?.value).toBe('rgb(255,0,0)');
    expect(fixture.context.toolbar.querySelector('[aria-label="Delete state"]')).not.toBeNull();
    cleanup();
  });

  it('selects legacy Mermaid stateGroup nodes by their source IDs', () => {
    const fixture = makeContext('stateDiagram\nA --> B\n', '<g class="stateGroup" id="A"></g><g class="stateGroup" id="B"></g><path class="transition" id="edge0"></path>');
    const cleanup = stateAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('#A')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'state', id: 'A' });
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Connect two states"]')!.click();
    fixture.context.svg.querySelector<SVGGElement>('#A')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.context.svg.querySelector<SVGGElement>('#B')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.getSource()).toBe('stateDiagram\nA --> B\nA --> B\n');
    cleanup();
  });

  it('maps nodes emitted by the pinned Mermaid state renderer for legacy source syntax', async () => {
    const source = 'stateDiagram\nA --> B\n';
    const fixture = await makeRenderedContext(source, 'legacy-state-adapter-test');
    const cleanup = stateAdapter.mount(fixture.context);
    const stateA = fixture.context.svg.querySelector<SVGGElement>('g.statediagram-state[id$="state-A-0"]');
    expect(stateA).not.toBeNull();
    stateA!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'state', id: 'A' });
    cleanup();
  });

  it('maps rendered legacy transition paths to duplicate source transitions in order', async () => {
    const source = 'stateDiagram\nA --> B : first\nA --> B : second\n';
    const fixture = await makeRenderedContext(source, 'legacy-state-edge-adapter-test');
    const cleanup = stateAdapter.mount(fixture.context);
    const transitions = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition, .edgePaths path, g.edgePath path');
    expect(transitions).toHaveLength(2);
    transitions[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: 'A', target: 'B', occurrence: 0 });
    transitions[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: 'A', target: 'B', occurrence: 1 });
    cleanup();
  });

  it('maps rendered stateDiagram-v2 transition paths to duplicate source transitions in order', async () => {
    const source = 'stateDiagram-v2\nA --> B : first\nA --> B : second\n';
    const fixture = await makeRenderedContext(source, 'v2-state-edge-adapter-test');
    const cleanup = stateAdapter.mount(fixture.context);
    const transitions = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition, .edgePaths path, g.edgePath path');
    expect(transitions).toHaveLength(2);
    transitions[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: 'A', target: 'B', occurrence: 0 });
    transitions[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: 'A', target: 'B', occurrence: 1 });
    cleanup();
  });

  it('maps a rendered Unicode transition to its source edge in stateDiagram-v2', async () => {
    const source = 'stateDiagram-v2\n상태 --> 완료 : first\nA --> B : second\n';
    const fixture = await makeRenderedContext(source, 'v2-state-unicode-edge-adapter-test');
    const cleanup = stateAdapter.mount(fixture.context);
    const unicodeNode = [...fixture.context.svg.querySelectorAll<SVGGElement>('g.statediagram-state')]
      .find((group) => group.id.includes('state-상태-'));
    expect(unicodeNode).toBeDefined();
    unicodeNode!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'state', id: '상태' });
    const transitions = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition:not(.note-edge)');
    expect(transitions).toHaveLength(2);
    transitions[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: '상태', target: '완료', occurrence: 0 });
    const label = fixture.context.toolbar.querySelector<HTMLTextAreaElement>('[aria-label="Transition label"]')!;
    label.value = 'revised';
    label.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.getSource()).toBe('stateDiagram-v2\n상태 --> 완료 : revised\nA --> B : second\n');
    cleanup();
  });

  it('maps a rendered Unicode transition to its source edge in legacy stateDiagram', async () => {
    const source = 'stateDiagram\n상태 --> 완료 : first\nA --> B : second\n';
    const fixture = await makeRenderedContext(source, 'legacy-state-unicode-edge-adapter-test');
    const cleanup = stateAdapter.mount(fixture.context);
    const transitions = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition:not(.note-edge)');
    expect(transitions).toHaveLength(2);
    transitions[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: '상태', target: '완료', occurrence: 0 });
    const label = fixture.context.toolbar.querySelector<HTMLTextAreaElement>('[aria-label="Transition label"]')!;
    label.value = 'revised';
    label.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.getSource()).toBe('stateDiagram\n상태 --> 완료 : revised\nA --> B : second\n');
    cleanup();
  });

  it('ignores a rendered legacy note connector when selecting a source transition', async () => {
    const source = 'stateDiagram\nA --> B : first\nnote right of B\n  attached note\nend note\nC --> D : original\n';
    const fixture = await makeRenderedContext(source, 'legacy-state-note-edge-adapter-test');
    const cleanup = stateAdapter.mount(fixture.context);
    const paths = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition');
    expect(fixture.context.svg.querySelectorAll('path.note-edge')).toHaveLength(1);
    const transitionPaths = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition:not(.note-edge)');
    expect(transitionPaths).toHaveLength(2);
    const transition = transitionPaths[1];
    transition!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: 'C', target: 'D', occurrence: 0 });
    const label = fixture.context.toolbar.querySelector<HTMLTextAreaElement>('[aria-label="Transition label"]')!;
    label.value = 'revised';
    label.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.getSource()).toContain('C --> D : revised');
    expect(paths).toHaveLength(3);
    cleanup();
  });

  it('ignores a rendered stateDiagram-v2 note connector when selecting a source transition', async () => {
    const source = 'stateDiagram-v2\nA --> B : first\nnote right of B\n  attached note\nend note\nC --> D : original\n';
    const fixture = await makeRenderedContext(source, 'v2-state-note-edge-adapter-test');
    const cleanup = stateAdapter.mount(fixture.context);
    const paths = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition');
    expect(fixture.context.svg.querySelectorAll('path.note-edge')).toHaveLength(1);
    const transitionPaths = fixture.context.svg.querySelectorAll<SVGPathElement>('path.transition:not(.note-edge)');
    expect(transitionPaths).toHaveLength(2);
    const transition = transitionPaths[1];
    transition!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'state', source: 'C', target: 'D', occurrence: 0 });
    const label = fixture.context.toolbar.querySelector<HTMLTextAreaElement>('[aria-label="Transition label"]')!;
    label.value = 'revised';
    label.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.getSource()).toContain('C --> D : revised');
    expect(paths).toHaveLength(3);
    cleanup();
  });
});
