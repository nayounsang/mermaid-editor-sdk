import { describe, expect, it } from 'vitest';
import type { DiagramElement } from './diagram-model';
import { getDiagramElementIdForSelection } from './selection-mapping';

const elements: DiagramElement[] = [
  { id: 'flowchart:node:A%20B', kind: 'node', diagramType: 'flowchart', label: 'A B', attributes: {} },
  { id: 'flowchart:subgraph:g%20one', kind: 'subgraph', diagramType: 'flowchart', label: 'Group', attributes: {} },
  { id: 'flowchart:edge:A:B:0', kind: 'edge', diagramType: 'flowchart', source: 'A', target: 'B', operator: '-->', label: '', occurrence: 0, attributes: {} },
  { id: 'flowchart:edge:A:B:1', kind: 'edge', diagramType: 'flowchart', source: 'A', target: 'B', operator: '-->', label: '', occurrence: 1, attributes: {} },
];

describe('getDiagramElementIdForSelection', () => {
  it('maps encoded node and subgraph identifiers', () => {
    expect(getDiagramElementIdForSelection(elements, { kind: 'node', diagramType: 'flowchart', id: 'A B' })).toBe('flowchart:node:A%20B');
    expect(getDiagramElementIdForSelection(elements, { kind: 'subgraph', diagramType: 'flowchart', id: 'g one' })).toBe('flowchart:subgraph:g%20one');
  });

  it('maps an edge occurrence and defaults an omitted occurrence to zero', () => {
    expect(getDiagramElementIdForSelection(elements, { kind: 'edge', diagramType: 'flowchart', source: 'A', target: 'B' })).toBe('flowchart:edge:A:B:0');
    expect(getDiagramElementIdForSelection(elements, { kind: 'edge', diagramType: 'flowchart', source: 'A', target: 'B', occurrence: 1 })).toBe('flowchart:edge:A:B:1');
  });

  it('returns undefined when the selected element is absent', () => {
    expect(getDiagramElementIdForSelection(elements, { kind: 'node', diagramType: 'flowchart', id: 'missing' })).toBeUndefined();
    expect(getDiagramElementIdForSelection(elements, { kind: 'edge', diagramType: 'class', source: 'A', target: 'B' })).toBeUndefined();
    expect(getDiagramElementIdForSelection(elements, { kind: 'subgraph', diagramType: 'flowchart', id: 'missing' })).toBeUndefined();
  });
});
