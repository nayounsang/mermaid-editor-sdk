export { DiagramSession } from './core/diagram-session';
export { EditorController } from './core/editor-controller';
export { getDiagramElementIdForSelection } from './core/selection-mapping';
export type {
  ChangeOrigin,
  DiagramAction,
  DiagramEdge,
  DiagramElement,
  DiagramNode,
  DiagramSemanticElement,
  DiagramType,
  EditorSelection,
  FlowchartNodeShape,
  RendererModel,
  SessionSnapshot,
} from './core/diagram-model';
export { AmbiguousSourceMutationError, SourceDocument, appendSourceLines } from './source/source-document';
export type { PaletteGroup } from './source/palette-source';
export { classifyDiagram, withParseResult, withPreviewResult } from './diagrams/capability';
export type { DiagramCapability } from './diagrams/capability';
export { appendPaletteEntry, diagramTypeFromSource, diagramTypes, paletteCatalog, templates } from './runtime/diagram-catalog';
export type { EditableDiagramType, PaletteEntry } from './runtime/diagram-catalog';
export * from './source/class-mutations';
export * from './source/er-mutations';
export * from './source/flowchart-mutations';
export * from './source/gantt-mutations';
export * from './source/gitgraph-mutations';
export * from './source/journey-mutations';
export * from './source/mindmap-mutations';
export * from './source/pie-mutations';
export * from './source/quadrant-mutations';
export * from './source/sequence-mutations';
export * from './source/state-mutations';
export * from './source/timeline-mutations';
