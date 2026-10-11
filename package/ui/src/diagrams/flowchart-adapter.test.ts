import { afterEach, describe, expect, it, vi } from 'vitest';
import { flowchartAdapter } from './flowchart-adapter';
import type { DiagramAdapterContext } from './adapter';
import { SourceDocument } from '@mermaid-editor-sdk/headless';

function makeContext(
  source: string,
  svgMarkup: string,
  edgeOptions: { readonly operator: string; readonly label: string } = { operator: '-->', label: '' },
): { context: DiagramAdapterContext; getSource: () => string; selection: () => unknown } {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = svgMarkup;
  const svg = canvas.querySelector('svg')!;
  let value = source;
  let selected: unknown = undefined;
  const context: DiagramAdapterContext = {
    diagramType: 'flowchart',
    toolbar,
    canvas,
    svg,
    sourceDocument: new SourceDocument(value, 'flowchart'),
    getFlowchartEdgeOptions: () => edgeOptions,
    applySourceMutation(mutate) { value = mutate(new SourceDocument(value, 'flowchart')); return true; },
    setSelection(selection) { selected = selection; },
  };
  return { context, getSource: () => value, selection: () => selected };
}

afterEach(() => vi.restoreAllMocks());

describe('Flowchart adapter', () => {
  it('selects a node on click without creating an edge', () => {
    const fixture = makeContext('flowchart LR\nA[Alpha]\nB[Beta]\n',
      '<svg><g class="node" data-id="A"></g><g class="node" data-id="B"></g></svg>');
    const cleanup = flowchartAdapter.mount(fixture.context);

    fixture.context.svg.querySelector<SVGGElement>('[data-id="A"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.context.svg.querySelector<SVGGElement>('[data-id="B"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fixture.getSource()).not.toContain('A --> B');
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'flowchart', id: 'B' });
    cleanup();
  });

  it('connects nodes released after a pointer drag', () => {
    const fixture = makeContext('flowchart LR\nA[Alpha]\nB[Beta]\n',
      '<svg><g class="node" data-id="A"></g><g class="node" data-id="B"></g></svg>');
    const cleanup = flowchartAdapter.mount(fixture.context);
    const source = fixture.context.svg.querySelector<SVGGElement>('[data-id="A"]')!;
    const target = fixture.context.svg.querySelector<SVGGElement>('[data-id="B"]')!;

    source.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
    target.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));

    expect(fixture.getSource()).toContain('A --> B');
    cleanup();
  });

  it('moves an existing edge endpoint to another node', () => {
    const fixture = makeContext('flowchart LR\nA[Alpha]\nB[Beta]\nC[Gamma]\nA --> B\n',
      '<svg><g class="node" data-id="A"></g><g class="node" data-id="B"></g><g class="node" data-id="C"></g><g class="edgePath" id="L-A-B-0"><path></path></g></svg>');
    const path = fixture.context.svg.querySelector<SVGPathElement>('g.edgePath path')!;
    Object.defineProperties(path, {
      getTotalLength: { value: () => 10 },
      getPointAtLength: { value: (length: number) => ({ x: length, y: 0, matrixTransform() { return this; } }) },
      getScreenCTM: { value: () => ({}) },
    });
    const cleanup = flowchartAdapter.mount(fixture.context);
    path.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
    fixture.context.svg.querySelector<SVGGElement>('[data-id="C"]')!
      .dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));
    expect(fixture.getSource()).toContain('C --> B');
    expect(fixture.getSource()).not.toContain('A --> B');
    cleanup();
  });

  it('uses the selected edge type and label on each node-to-node drag', () => {
    const fixture = makeContext('flowchart LR\nA[Alpha]\nB[Beta]\nC[Gamma]\n',
      '<svg><g class="node" data-id="A"></g><g class="node" data-id="B"></g><g class="node" data-id="C"></g></svg>',
      { operator: '-.->', label: 'review' });
    const cleanup = flowchartAdapter.mount(fixture.context);
    const drag = (from: string, to: string): void => {
      fixture.context.svg.querySelector<SVGGElement>(`[data-id="${from}"]`)!
        .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
      fixture.context.svg.querySelector<SVGGElement>(`[data-id="${to}"]`)!
        .dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));
    };
    drag('A', 'B');
    drag('B', 'C');
    expect(fixture.getSource()).toContain('A -.->|review| B');
    expect(fixture.getSource()).toContain('B -.->|review| C');
    cleanup();
  });

  it('exposes node and subgraph tools without connector buttons', () => {
    const fixture = makeContext('flowchart LR\nsubgraph SG[Group]\nA[Alpha]\nend\n',
      '<svg><g class="cluster" id="subGraph-SG-0"><g class="node" data-id="A"></g></g></svg>');
    const cleanup = flowchartAdapter.mount(fixture.context);
    expect(fixture.context.toolbar.querySelectorAll('[draggable="true"]')).toHaveLength(9);
    expect(fixture.context.toolbar.querySelectorAll('[aria-label*="connector"]')).toHaveLength(0);
    cleanup();
  });

  it('drops a new node into the target subgraph', () => {
    const fixture = makeContext('flowchart LR\nsubgraph SG[Group]\nA[Alpha]\nend\n',
      '<svg><g class="cluster" id="subGraph-SG-0"><g class="node" data-id="A"></g></g></svg>');
    const cleanup = flowchartAdapter.mount(fixture.context);
    const item = fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add decision"]')!;
    let payload = '';
    const transfer = {
      types: ['application/x-mve-flowchart-palette'],
      effectAllowed: 'copy',
      setData: (_type: string, value: string) => { payload = value; },
      getData: () => payload,
    };
    const dragStart = new Event('dragstart', { bubbles: true });
    Object.defineProperty(dragStart, 'dataTransfer', { value: transfer });
    item.dispatchEvent(dragStart);
    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: transfer });
    fixture.context.svg.querySelector<SVGGElement>('[data-id="A"]')!.dispatchEvent(drop);
    expect(fixture.getSource()).toContain('    A --> N1');
    expect(fixture.getSource()).toContain('    N1{Decision}');
    cleanup();
  });

  it('selects distinct occurrences of parallel edges from SVG path IDs', () => {
    const fixture = makeContext('flowchart LR\nA --> B\nA --> B\n',
      '<svg><g class="edgePath" id="L_A_B_0"></g><g class="edgePath" id="L_A_B_1"></g><g class="edgeLabel"></g><g class="edgeLabel"></g></svg>');
    const cleanup = flowchartAdapter.mount(fixture.context);
    const edges = fixture.context.svg.querySelectorAll<SVGGElement>('g.edgePath');

    edges[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'flowchart', source: 'A', target: 'B', occurrence: 0 });
    edges[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'flowchart', source: 'A', target: 'B', occurrence: 1 });
    fixture.context.svg.querySelectorAll<SVGGElement>('g.edgeLabel')[1]!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'flowchart', source: 'A', target: 'B', occurrence: 1 });
    cleanup();
  });

  it('highlights only the selected edge when different pairs have the same occurrence number', () => {
    const fixture = makeContext('flowchart LR\nA --> B\nC --> D\n',
      '<svg><g class="edgePath" id="L_A_B_0"></g><g class="edgePath" id="L_C_D_1"></g></svg>');
    const cleanup = flowchartAdapter.mount(fixture.context);

    fixture.context.svg.querySelector<SVGGElement>('#L_A_B_0')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fixture.context.svg.querySelectorAll('.mve-selected')).toHaveLength(1);
    expect(fixture.context.svg.querySelector('#L_A_B_0')!.classList.contains('mve-selected')).toBe(true);
    expect(fixture.context.svg.querySelector('#L_C_D_1')!.classList.contains('mve-selected')).toBe(false);
    cleanup();
  });

  it('selects the exact subgraph when one ID is a prefix of another', () => {
    const fixture = makeContext('flowchart LR\nsubgraph SG1[Short]\nA[a]\nend\nsubgraph SG10[Long]\nB[b]\nend\n',
      '<svg><g class="cluster" id="subGraph-SG1-0"></g><g class="cluster" id="subGraph-SG10-1"></g></svg>');
    const cleanup = flowchartAdapter.mount(fixture.context);

    fixture.context.svg.querySelector<SVGGElement>('#subGraph-SG10-1')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fixture.selection()).toEqual({ kind: 'subgraph', diagramType: 'flowchart', id: 'SG10', title: 'Long' });
    cleanup();
  });
});
