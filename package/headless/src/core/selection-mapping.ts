import type { DiagramElement, EditorSelection } from './diagram-model';

export function getDiagramElementIdForSelection(elements: readonly DiagramElement[], selection: EditorSelection): string | undefined {
  if (selection.kind === 'node') {
    return elements.find((element) => element.kind === 'node'
      && element.id === `${selection.diagramType}:node:${encodeURIComponent(selection.id)}`)?.id;
  }
  if (selection.kind === 'subgraph') {
    return elements.find((element) => element.kind === 'subgraph'
      && element.id === `${selection.diagramType}:subgraph:${encodeURIComponent(selection.id)}`)?.id;
  }
  return elements.find((element) => element.kind === 'edge' && element.diagramType === selection.diagramType
    && element.source === selection.source && element.target === selection.target
    && element.occurrence === (selection.occurrence ?? 0))?.id;
}
