import type { DiagramType } from '../diagrams/capability';
import type { EditableDiagramType } from '../runtime/diagram-catalog';
export type { DiagramType } from '../diagrams/capability';
import { z } from 'zod';

export type SourceRevision = number;
export type ModelRevision = number;

export interface MermaidCodeBlock {
  readonly source: string;
  readonly revision: SourceRevision;
}

export type FlowchartNodeShape = 'bare' | 'rect' | 'round' | 'diamond' | 'circle' | 'stadium' | 'subroutine' | 'database' | 'hexagon';

export interface DiagramNode {
  readonly id: string;
  readonly kind: 'node';
  readonly diagramType: EditableDiagramType;
  readonly label: string;
  readonly shape?: FlowchartNodeShape;
  readonly attributes: Readonly<Record<string, string>>;
}

export interface DiagramEdge {
  readonly id: string;
  readonly kind: 'edge';
  readonly diagramType: EditableDiagramType;
  readonly source: string;
  readonly target: string;
  readonly operator: string;
  readonly label: string;
  readonly occurrence: number;
  readonly attributes: Readonly<Record<string, string>>;
}

export interface DiagramSubgraph {
  readonly id: string;
  readonly kind: 'subgraph';
  readonly diagramType: 'flowchart';
  readonly label: string;
  readonly attributes: Readonly<Record<string, string>>;
}

export interface DiagramSemanticElement {
  readonly id: string;
  readonly kind: 'semantic';
  readonly diagramType: EditableDiagramType;
  readonly semanticType: string;
  readonly sourceLine: number;
  readonly statement: string;
  readonly attributes: Readonly<Record<string, string>>;
}

export type DiagramElement = DiagramNode | DiagramEdge | DiagramSubgraph | DiagramSemanticElement;

export interface RendererModel {
  readonly diagramType: DiagramType;
  readonly revision: ModelRevision;
  readonly sourceRevision: SourceRevision;
  readonly elements: readonly DiagramElement[];
  readonly parseState: 'pending' | 'parsed' | 'invalid' | 'unsupported' | 'unknown';
}

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

export type DiagramAction = z.infer<typeof diagramActionSchema>;

export interface SessionSnapshot {
  readonly codeBlock: MermaidCodeBlock;
  readonly model: RendererModel;
  readonly origin: ChangeOrigin;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}
