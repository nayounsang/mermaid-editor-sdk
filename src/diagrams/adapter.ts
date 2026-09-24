import type { EditorSelection } from '../runtime/types';
import type { SourceDocument } from '../source/source-document';
import type { DiagramType } from './capability';

export type AdapterDiagramType = Exclude<DiagramType, 'unknown' | 'unsupported'>;

export interface DiagramAdapterContext {
  readonly diagramType: AdapterDiagramType;
  readonly toolbar: HTMLElement;
  readonly canvas: HTMLElement;
  readonly svg: SVGSVGElement;
  readonly sourceDocument: SourceDocument;
  applySourceMutation(mutate: (source: SourceDocument) => string): void;
  setSelection(selection: EditorSelection | null): void;
}

export interface DiagramAdapter {
  readonly diagramType: AdapterDiagramType;
  mount(context: DiagramAdapterContext): () => void;
}

const adapters = new Map<AdapterDiagramType, DiagramAdapter>();

export function getDiagramAdapter(diagramType: AdapterDiagramType): DiagramAdapter | undefined {
  return adapters.get(diagramType);
}

export function registerDiagramAdapter(adapter: DiagramAdapter): () => void {
  const current = adapters.get(adapter.diagramType);
  adapters.set(adapter.diagramType, adapter);
  return () => {
    if (adapters.get(adapter.diagramType) !== adapter) return;
    if (current) adapters.set(adapter.diagramType, current);
    else adapters.delete(adapter.diagramType);
  };
}
