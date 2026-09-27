import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import {
  addFlowchartEdge,
  addFlowchartEdgeToSubgraph,
  addFlowchartNode,
  addFlowchartNodeToSubgraph,
  addFlowchartSubgraph,
  addFlowchartSubgraphToSubgraph,
  deleteFlowchartEdge,
  deleteFlowchartNode,
  deleteFlowchartSubgraph,
  getFlowchartElementStyle,
  isFlowchartEdgeIndexingSafe,
  listFlowchartEdges,
  listFlowchartNodes,
  listFlowchartSubgraphs,
  setFlowchartEdge,
  setFlowchartEdgeStyle,
  setFlowchartNode,
  setFlowchartNodeStyle,
  setFlowchartSubgraph,
} from './flowchart-mutations';

describe('Flowchart source mutations', () => {
  it('selects nodes and edges in chained statements', () => {
    const source = 'flowchart LR\nA --> B --> C\n';

    expect(listFlowchartNodes(source).map(({ id }) => id)).toEqual(['A', 'B', 'C']);
    expect(listFlowchartEdges(source).map(({ source: from, target }) => [from, target])).toEqual([['A', 'B'], ['B', 'C']]);
    expect(isFlowchartEdgeIndexingSafe(source)).toBe(true);
  });

  it('parses Mermaid node IDs containing supported punctuation before a shape or edge', async () => {
    const source = 'flowchart LR\ncustomer-order[Customer order] --> archive.v2[Archive]\n';

    expect(listFlowchartNodes(source).map(({ id }) => id)).toEqual(['archive.v2', 'customer-order']);
    expect(listFlowchartEdges(source).map(({ source: from, target }) => [from, target]))
      .toEqual([['customer-order', 'archive.v2']]);
    await expect(mermaid.parse(source)).resolves.toBeTruthy();
  });

  it('parses an unspaced Mermaid arrow without absorbing its first dash into the node ID', () => {
    expect(listFlowchartEdges('flowchart LR\nA-->B\n').map(({ source: from, target }) => [from, target]))
      .toEqual([['A', 'B']]);
  });

  it('selects endpoints in Mermaid text-label edge syntax', async () => {
    const source = 'flowchart LR\nA -- sends data --> B\n';
    const [edge] = listFlowchartEdges(source);

    expect(listFlowchartNodes(source).map(({ id }) => id)).toEqual(['A', 'B']);
    expect(edge).toMatchObject({ source: 'A', target: 'B', label: 'sends data', operator: '-->' });
    const changed = setFlowchartEdge(source, edge!, { label: 'returns' });
    expect(changed).toBe('flowchart LR\nA -->|returns| B\n');
    await expect(mermaid.parse(changed)).resolves.toBeTruthy();
  });

  it('edits one node token while preserving BOM, CRLF, comments, and unrelated source', () => {
    const source = '\uFEFFflowchart LR\r\n%% A is only a comment\r\nA[old] --> B[keep]\r\n';

    expect(setFlowchartNode(source, 'A', { id: 'Start', label: 'new name', shape: 'round' }))
      .toBe('\uFEFFflowchart LR\r\n%% A is only a comment\r\nStart("new name") --> B[keep]\r\n');
  });

  it('adds a label when editing an implicitly labeled bare node', () => {
    expect(setFlowchartNode('flowchart LR\nA --> B\n', 'A', { label: 'Start here' }))
      .toBe('flowchart LR\nA["Start here"] --> B\n');
  });

  it('removes a shape delimiter when setting a node back to bare', () => {
    expect(setFlowchartNode('flowchart LR\nA[Start]\n', 'A', { shape: 'bare' }))
      .toBe('flowchart LR\nA\n');
  });

  it('updates repeated shaped definitions so Mermaid cannot keep a later label override', () => {
    const source = 'flowchart LR\nA[First] --> B\nC --> A[Last]\n';

    expect(listFlowchartNodes(source).find(({ id }) => id === 'A')?.label).toBe('Last');
    expect(setFlowchartNode(source, 'A', { label: 'Updated' }))
      .toBe('flowchart LR\nA[Updated] --> B\nC --> A[Updated]\n');
  });

  it('preserves different labels when only renaming a repeated node ID', () => {
    const source = 'flowchart LR\nA[First] --> B\nC --> A[Last]\n';

    expect(setFlowchartNode(source, 'A', { id: 'Start' }))
      .toBe('flowchart LR\nStart[First] --> B\nC --> Start[Last]\n');
  });

  it('adds a label to the last bare reference when a node appears on several edges', () => {
    const source = 'flowchart LR\nA --> C\nA --> B\n';

    expect(setFlowchartNode(source, 'A', { label: 'Start' }))
      .toBe('flowchart LR\nA --> C\nA[Start] --> B\n');
  });

  it('edits a declared node without any connecting edge', () => {
    expect(setFlowchartNode('flowchart LR\nA[Standalone]\n', 'A', { label: 'Updated' }))
      .toBe('flowchart LR\nA[Updated]\n');
  });

  it('adds a stroke to an existing edge style that only sets another property', () => {
    const source = 'flowchart LR\nA --> B\nlinkStyle 0 fill:red\n';
    const edge = listFlowchartEdges(source)[0]!;

    expect(setFlowchartEdgeStyle(source, edge, 'blue')).toContain('linkStyle 0 fill:red,stroke:blue');
  });

  it('rejects a node edit when its source token occurs more than once', () => {
    const source = 'flowchart LR\nA[one]\nA[two]\n';

    expect(() => setFlowchartNode(source, 'A', { label: 'changed' })).toThrow(/ambiguous/i);
  });

  it('rejects deleting a node while an opaque click directive still references it', () => {
    const source = 'flowchart LR\nA[Start] --> B[End]\nclick A "https://example.com"\n';

    expect(() => deleteFlowchartNode(source, 'A')).toThrow(/opaque click reference/i);
  });

  it('keeps other nodes when deleting a node from a chained statement', () => {
    const source = 'flowchart LR\nA[Start] --> B[Remove] --> C[Keep]\n';

    expect(deleteFlowchartNode(source, 'B'))
      .toBe('flowchart LR\nA[Start]\nC[Keep]\n');
  });

  it('renames exact class selectors and rejects deleting one member of a shared directive', () => {
    const source = 'flowchart LR\nA[one] --> B[two]\nclass A,B group\n';

    expect(setFlowchartNode(source, 'A', { id: 'Start' })).toContain('class Start,B group');
    expect(() => deleteFlowchartNode(source, 'A')).toThrow(/shares a class directive/i);
  });

  it('escapes punctuation when renaming IDs in class and style references', () => {
    const source = 'flowchart LR\nA.1[one] --> B\nA11[other] --> C\nclass A.1 exact\nclass A11 other\nstyle A.1 fill:red\n';
    const changed = setFlowchartNode(source, 'A.1', { id: 'Start' });

    expect(changed).toContain('class Start exact');
    expect(changed).toContain('class A11 other');
    expect(changed).toContain('style Start fill:red');
  });

  it('adds and removes a node without changing the existing final newline policy', () => {
    const source = 'flowchart LR\r\nA[old]';
    const added = addFlowchartNode(source, 'B', 'new', 'diamond');

    expect(added).toBe('flowchart LR\r\nA[old]\r\nB{new}');
    expect(deleteFlowchartNode(added, 'B')).toBe(source);
  });

  it('adds and deletes an edge while keeping parallel edges and linkStyle directives aligned', () => {
    const source = 'flowchart LR\nA --> B\nA --> B\nlinkStyle 0 stroke:red\nlinkStyle 1 stroke:blue\n';
    const edges = listFlowchartEdges(source);

    expect(edges.map((edge) => edge.occurrence)).toEqual([0, 1]);
    const withEdge = addFlowchartEdge(source, 'B', 'A', '-->', 'return');
    expect(listFlowchartEdges(withEdge)).toHaveLength(3);
    expect(deleteFlowchartEdge(source, edges[0]!)).toBe('flowchart LR\nA --> B\nlinkStyle 0 stroke:blue\n');
  });

  it('disables edge-index mutations when one linkStyle directive targets multiple edges', () => {
    const source = 'flowchart LR\nA --> B\nB --> C\nlinkStyle 0,1 stroke:red\n';
    const [edge] = listFlowchartEdges(source);

    expect(isFlowchartEdgeIndexingSafe(source)).toBe(false);
    expect(() => deleteFlowchartEdge(source, edge!)).toThrow(/indexed safely/i);
  });

  it('keeps inline endpoint node definitions when deleting their only edge', () => {
    const source = 'flowchart LR\nA[Start] --> B{Finish}\n';
    const edge = listFlowchartEdges(source)[0]!;

    expect(deleteFlowchartEdge(source, edge)).toBe('flowchart LR\nA[Start]\nB{Finish}\n');
  });

  it('changes a chained edge label and operator without rewriting its neighbors', () => {
    const source = 'flowchart LR\n  A --> B --> C\n';
    const edge = listFlowchartEdges(source)[0]!;

    expect(setFlowchartEdge(source, edge, { label: 'next', operator: '-.->' }))
      .toBe('flowchart LR\n  A -.->|next| B --> C\n');
  });

  it('adds and updates node and edge style declarations', () => {
    const source = 'flowchart LR\nA[one] --> B[two]\n';
    const edge = listFlowchartEdges(source)[0]!;
    const nodeStyled = setFlowchartNodeStyle(source, 'A', 'fill', '#abc');
    const edgeStyled = setFlowchartEdgeStyle(source, edge, 'blue');

    expect(nodeStyled).toContain('style A fill:#abc');
    expect(setFlowchartNodeStyle(nodeStyled, 'A', 'stroke', 'red')).toContain('fill:#abc,stroke:red');
    const bordered = setFlowchartNodeStyle(nodeStyled, 'A', 'stroke-dasharray', '6 4');
    expect(getFlowchartElementStyle(bordered, 'A', 'stroke-dasharray')).toBe('6 4');
    expect(setFlowchartNodeStyle(bordered, 'A', 'stroke-dasharray', '')).toBe(nodeStyled);
    expect(edgeStyled).toContain('linkStyle 0 stroke:blue');
  });

  it('adds, edits, selects, and deletes identified subgraphs', () => {
    const source = 'flowchart LR\nA[one]\n';
    const added = addFlowchartSubgraph(source, 'SG1', 'Group one');
    const graph = listFlowchartSubgraphs(added)[0]!;

    expect(graph).toMatchObject({ id: 'SG1', title: 'Group one' });
    expect(setFlowchartSubgraph(added, 'SG1', { id: 'Group', title: 'Renamed', fill: '#eee' }))
      .toContain('subgraph Group[Renamed]');
    expect(setFlowchartSubgraph(added, 'SG1', { fill: '#eee' })).toContain('style SG1 fill:#eee');
    expect(setFlowchartSubgraph(added, 'SG1', { borderType: 'dotted' })).toContain('style SG1 stroke-dasharray:2 3');
    expect(setFlowchartSubgraph(setFlowchartSubgraph(added, 'SG1', { borderType: 'dotted' }), 'SG1', { borderType: 'default' })).toBe(added);
    expect(deleteFlowchartSubgraph(added, 'SG1')).toBe(source);
    expect(() => setFlowchartSubgraph(added, 'SG1', { id: 'SG2\nA --> B' })).toThrow(/ID is not supported/i);
  });

  it('inserts nodes, connectors, and nested subgraphs before the innermost closing end', async () => {
    const source = 'flowchart LR\r\nsubgraph Outer[Outer]\r\n    A[one]\r\n    subgraph Inner[Inner]\r\n        B[two]\r\n    end\r\nend\r\n';
    const node = addFlowchartNodeToSubgraph(source, 'Inner', 'C', 'three', 'circle');
    const edge = addFlowchartEdgeToSubgraph(node, 'Inner', 'B', 'C', '-.->');
    const nested = addFlowchartSubgraphToSubgraph(edge, 'Inner', 'Deep', 'Deep group');

    expect(nested).toContain('        C((three))\r\n        B -.-> C');
    expect(nested).toContain('        subgraph Deep["Deep group"]\r\n            Deep_node["Deep group"]\r\n        end\r\n    end');
    expect(nested.endsWith('\r\n')).toBe(true);
    await expect(mermaid.parse(nested)).resolves.toBeTruthy();
  });

  it('preserves BOM and no-trailing-newline policy for nested insertion', () => {
    const source = '\uFEFFflowchart LR\r\nsubgraph SG[Group]\r\nA[one]\r\nend';
    expect(addFlowchartNodeToSubgraph(source, 'SG', 'B', 'two'))
      .toBe('\uFEFFflowchart LR\r\nsubgraph SG[Group]\r\nA[one]\r\n    B[two]\r\nend');
  });

  it('rejects unsafe subgraph locations and invalid subgraph colors without changing the source', () => {
    const source = 'flowchart LR\nsubgraph SG[Group]\nA[one]\nend\n';
    for (const color of ['', 'red\nA --> B', 'red,blue']) {
      expect(() => setFlowchartSubgraph(source, 'SG', { fill: color })).toThrow(/color is not supported/i);
    }
    expect(() => addFlowchartNodeToSubgraph(source, 'missing', 'B', 'two')).toThrow(/located safely/i);
    expect(() => addFlowchartEdgeToSubgraph(source, 'missing', 'A', 'A')).toThrow(/located safely/i);
    expect(() => addFlowchartSubgraphToSubgraph(source, 'missing', 'Child', 'Child')).toThrow(/located safely/i);
    expect(source).toBe('flowchart LR\nsubgraph SG[Group]\nA[one]\nend\n');
  });

  it('rejects node IDs that collide with subgraph IDs', () => {
    const source = 'flowchart LR\nsubgraph SG[Group]\nA[one]\nend\n';

    expect(() => addFlowchartNode(source, 'SG', 'Collision')).toThrow(/already exists/i);
    expect(() => setFlowchartNode(source, 'A', { id: 'SG' })).toThrow(/already exists/i);
  });

  it('chooses a subgraph member ID that does not collide with another subgraph', () => {
    const source = 'flowchart LR\nsubgraph SG1_node[Existing]\nA[one]\nend\n';

    expect(addFlowchartSubgraph(source, 'SG1', 'New')).toContain('SG1_node2[New]');
  });

  it('rejects deleting a subgraph while an opaque click directive references a member', () => {
    const source = 'flowchart LR\nsubgraph SG[Group]\nA[one]\nend\nclick A "https://example.com"\n';

    expect(() => deleteFlowchartSubgraph(source, 'SG')).toThrow(/opaque click reference/i);
  });

  it('keeps an outside endpoint when deleting its only edge to a subgraph member', () => {
    const source = 'flowchart LR\nA[Start] --> B[Inside]\nsubgraph SG[Group]\nB[Inside]\nend\n';

    expect(deleteFlowchartSubgraph(source, 'SG')).toBe('flowchart LR\nA[Start]\n');
  });

  it('rejects deleting a subgraph linked by a chained statement', () => {
    const source = 'flowchart LR\nA --> B --> C\nsubgraph SG[Group]\nB\nend\n';

    expect(() => deleteFlowchartSubgraph(source, 'SG')).toThrow(/chained edge statement/i);
  });

  it('keeps nodes selectable while disabling edge indexing for multi-endpoint statements', () => {
    const source = 'flowchart LR\nA & B --> C\n';

    expect(listFlowchartNodes(source).map(({ id }) => id)).toEqual(['A', 'B', 'C']);
    expect(isFlowchartEdgeIndexingSafe(source)).toBe(false);
    expect(() => addFlowchartEdge(source, 'A', 'C')).toThrow(/indexed safely/i);
  });

  it('produces valid source for the pinned Mermaid parser across supported shapes and subgraphs', async () => {
    const source = 'flowchart LR\nA[Start] --> B{Decision}\nB -->|Yes| C((Finish))\nsubgraph SG[Group]\nD([Input])\nE[[Routine]]\nF[(Store)]\nG{{Check}}\nend\n';
    const changed = setFlowchartNode(source, 'A', { label: 'new start' });

    await expect(mermaid.parse(source)).resolves.toBeTruthy();
    await expect(mermaid.parse(changed)).resolves.toBeTruthy();
    await expect(mermaid.parse(addFlowchartNode(changed, 'H', 'Other shape', 'hexagon'))).resolves.toBeTruthy();
  });

  it('quotes Mermaid reserved end text when adding a labeled node', async () => {
    const added = addFlowchartNode('flowchart LR\n', 'N1', 'end');

    expect(added).toContain('N1["end"]');
    await expect(mermaid.parse(added)).resolves.toBeTruthy();
  });
});
