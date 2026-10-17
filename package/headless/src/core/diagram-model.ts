import type { DiagramType } from '../diagrams/capability';
import type { EditableDiagramType } from '../runtime/diagram-catalog';
export type { DiagramType } from '../diagrams/capability';
import { z } from 'zod';

/** Selection reported by an interactive diagram canvas. */
export type EditorSelection =
  | {
      /** Selection discriminant for a node. */
      kind: 'node';
      /** Diagram containing the node. */
      diagramType: DiagramType;
      /** Selected node identifier. */
      id: string;
    }
  | {
      /** Selection discriminant for an edge. */
      kind: 'edge';
      /** Diagram containing the edge. */
      diagramType: DiagramType;
      /** Source node identifier. */
      source: string;
      /** Target node identifier. */
      target: string;
      /** Zero-based occurrence among edges with the same endpoints. */
      occurrence?: number;
    }
  | {
      /** Selection discriminant for a flowchart subgraph. */
      kind: 'subgraph';
      /** This selection variant is only used for flowcharts. */
      diagramType: 'flowchart';
      /** Selected subgraph identifier. */
      id: string;
      /** Selected subgraph title, when available. */
      title?: string;
    };

export type SourceRevision = number;
export type ModelRevision = number;

/** Mermaid source paired with its monotonically increasing source revision. */
export interface MermaidCodeBlock {
  /** Current Mermaid source text. */
  readonly source: string;
  /** Revision associated with `source`. */
  readonly revision: SourceRevision;
}

/** Supported visual shapes for flowchart nodes. */
export type FlowchartNodeShape = 'bare' | 'rect' | 'round' | 'diamond' | 'circle' | 'stadium' | 'subroutine' | 'database' | 'hexagon';

/** Renderable node in a parsed diagram model. */
export interface DiagramNode {
  /** Stable model identifier for the node. */
  readonly id: string;
  /** Discriminant identifying this element as a node. */
  readonly kind: 'node';
  /** Diagram syntax represented by the node. */
  readonly diagramType: EditableDiagramType;
  /** Display label. */
  readonly label: string;
  /** Flowchart node shape, when applicable. */
  readonly shape?: FlowchartNodeShape;
  /** Renderer attributes associated with the node. */
  readonly attributes: Readonly<Record<string, string>>;
}

/** Renderable relationship in a parsed diagram model. */
export interface DiagramEdge {
  /** Stable model identifier for the edge. */
  readonly id: string;
  /** Discriminant identifying this element as an edge. */
  readonly kind: 'edge';
  /** Diagram syntax represented by the edge. */
  readonly diagramType: EditableDiagramType;
  /** Source node identifier. */
  readonly source: string;
  /** Target node identifier. */
  readonly target: string;
  /** Mermaid relationship operator. */
  readonly operator: string;
  /** Relationship label. */
  readonly label: string;
  /** Zero-based occurrence among equivalent relationships. */
  readonly occurrence: number;
  /** Renderer attributes associated with the edge. */
  readonly attributes: Readonly<Record<string, string>>;
}

/** Flowchart subgraph represented in the renderer model. */
export interface DiagramSubgraph {
  /** Stable model identifier for the subgraph. */
  readonly id: string;
  /** Discriminant identifying this element as a subgraph. */
  readonly kind: 'subgraph';
  /** Subgraphs are currently supported for flowcharts. */
  readonly diagramType: 'flowchart';
  /** Displayed subgraph label. */
  readonly label: string;
  /** Renderer attributes associated with the subgraph. */
  readonly attributes: Readonly<Record<string, string>>;
}

/** Diagram statement represented semantically when it has no editable graph shape. */
export interface DiagramSemanticElement {
  /** Stable model identifier for the semantic element. */
  readonly id: string;
  /** Discriminant identifying this element as semantic. */
  readonly kind: 'semantic';
  /** Diagram syntax represented by the statement. */
  readonly diagramType: EditableDiagramType;
  /** Semantic category assigned to the statement. */
  readonly semanticType: string;
  /** One-based source line containing the statement. */
  readonly sourceLine: number;
  /** Original Mermaid statement text. */
  readonly statement: string;
  /** Parsed attributes associated with the semantic element. */
  readonly attributes: Readonly<Record<string, string>>;
}

/** Union of graph elements and semantic statements in a renderer model. */
export type DiagramElement = DiagramNode | DiagramEdge | DiagramSubgraph | DiagramSemanticElement;

/** Parsed diagram state used by the UI and selection tools. */
export interface RendererModel {
  /** Detected Mermaid diagram type. */
  readonly diagramType: DiagramType;
  /** Revision of this model snapshot. */
  readonly revision: ModelRevision;
  /** Source revision from which this model was created. */
  readonly sourceRevision: SourceRevision;
  /** Renderable nodes, edges, subgraphs, and semantic elements. */
  readonly elements: readonly DiagramElement[];
  /** Current parser state for the source. */
  readonly parseState: 'pending' | 'parsed' | 'invalid' | 'unsupported' | 'unknown';
}

/** Origin of the change that most recently updated a session. */
export type ChangeOrigin = 'host' | 'source-editor' | 'diagram-action' | 'history';

const nodeShapeSchema = z.enum(['bare', 'rect', 'round', 'diamond', 'circle', 'stadium', 'subroutine', 'database', 'hexagon']);
const nodePatchSchema = z.object({
  id: z.string().min(1).optional(), label: z.string().optional(), shape: nodeShapeSchema.optional(),
  fill: z.string().optional(), stroke: z.string().optional(), borderType: z.enum(['default', 'solid', 'dashed', 'dotted']).optional(),
}).strict();
const edgePatchSchema = z.object({
  source: z.string().min(1).optional(), target: z.string().min(1).optional(), label: z.string().optional(), operator: z.string().optional(), stroke: z.string().optional(),
  cardinality: z.enum(['one-one', 'one-many', 'many-many', 'zero-one', 'one-or-many']).optional(), identifying: z.boolean().optional(),
}).strict();
const erAttributePatchSchema = z.object({ type: z.string().min(1).optional(), name: z.string().min(1).optional(), key: z.string().optional(), comment: z.string().optional() }).strict();

/** @internal Runtime validator used to check session actions. */
export const diagramActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('create-node'), id: z.string().min(1).optional(), label: z.string().optional(), shape: nodeShapeSchema.optional(), empty: z.boolean().optional(), withDefaultAttribute: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('create-connected-node'), source: z.string().min(1), id: z.string().min(1).optional(), label: z.string().optional(), shape: nodeShapeSchema.optional() }).strict(),
  z.object({ type: z.literal('update-node'), id: z.string().min(1), patch: nodePatchSchema }).strict(),
  z.object({ type: z.literal('delete-node'), id: z.string().min(1) }).strict(),
  z.object({ type: z.literal('create-edge'), source: z.string().min(1), target: z.string().min(1), label: z.string().optional(), operator: z.string().optional(), cardinality: z.enum(['one-one', 'one-many', 'many-many', 'zero-one', 'one-or-many']).optional(), identifying: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('update-edge'), id: z.string().min(1), patch: edgePatchSchema }).strict(),
  z.object({ type: z.literal('delete-edge'), id: z.string().min(1) }).strict(),
  z.object({ type: z.literal('create-subgraph'), id: z.string().min(1).optional(), title: z.string().optional() }).strict(),
  z.object({ type: z.literal('update-subgraph'), id: z.string().min(1), patch: z.object({
    id: z.string().min(1).optional(), title: z.string().optional(), fill: z.string().optional(), stroke: z.string().optional(),
    borderType: z.enum(['default', 'solid', 'dashed', 'dotted']).optional(),
  }).strict() }).strict(),
  z.object({ type: z.literal('delete-subgraph'), id: z.string().min(1) }).strict(),
  z.object({ type: z.literal('create-class-member'), classId: z.string().min(1), member: z.string().min(1).optional() }).strict(),
  z.object({ type: z.literal('update-class-member'), classId: z.string().min(1), oldMember: z.string().min(1), newMember: z.string().min(1) }).strict(),
  z.object({ type: z.literal('delete-class-member'), classId: z.string().min(1), member: z.string().min(1) }).strict(),
  z.object({ type: z.literal('create-er-attribute'), entity: z.string().min(1), attribute: erAttributePatchSchema.optional() }).strict(),
  z.object({ type: z.literal('update-er-attribute'), entity: z.string().min(1), name: z.string().min(1), occurrence: z.number().int().nonnegative(), patch: erAttributePatchSchema }).strict(),
  z.object({ type: z.literal('delete-er-attribute'), entity: z.string().min(1), name: z.string().min(1), occurrence: z.number().int().nonnegative() }).strict(),
  z.object({ type: z.literal('insert-palette-entry'), snippet: z.string().min(1), paletteItem: z.string().optional() }).strict(),
  z.object({ type: z.literal('insert-state-palette-entry'), item: z.enum(['simple', 'composite', 'choice', 'note', 'start-transition', 'end-transition']), stateId: z.string().min(1).optional(), label: z.string().optional() }).strict(),
]);

/**
 * Validated editing operation accepted by a diagram session.
 *
 * @remarks
 * The `type` field selects one of these operations:
 *
 * - Nodes: `create-node`, `create-connected-node`, `update-node`, `delete-node`.
 * - Edges: `create-edge`, `update-edge`, `delete-edge`.
 * - Subgraphs: `create-subgraph`, `update-subgraph`, `delete-subgraph`.
 * - Class members: `create-class-member`, `update-class-member`, `delete-class-member`.
 * - ER attributes: `create-er-attribute`, `update-er-attribute`, `delete-er-attribute`.
 * - Palette entries: `insert-palette-entry`, `insert-state-palette-entry`.
 */
export type DiagramAction = z.infer<typeof diagramActionSchema>;

/** Immutable session snapshot exposed to subscribers. */
export interface SessionSnapshot {
  /** Current Mermaid source and its revision. */
  readonly codeBlock: MermaidCodeBlock;
  /** Parsed diagram model. */
  readonly model: RendererModel;
  /** Origin of the last source update. */
  readonly origin: ChangeOrigin;
  /** Whether undo can restore an earlier source. */
  readonly canUndo: boolean;
  /** Whether redo can restore a later source. */
  readonly canRedo: boolean;
}
