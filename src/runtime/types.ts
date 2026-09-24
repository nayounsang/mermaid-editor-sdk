import type { DiagramType } from '../diagrams/capability';

export type EditorSelection =
  | { kind: 'node'; diagramType: DiagramType; id: string }
  | { kind: 'edge'; diagramType: DiagramType; source: string; target: string; occurrence?: number }
  | { kind: 'subgraph'; diagramType: 'flowchart'; id: string; title?: string };

export interface EditorError {
  code: 'parse' | 'render' | 'mutation' | 'destroyed';
  message: string;
  cause?: unknown;
}

export interface MermaidVisualEditorOptions {
  value: string;
  onChange?: (value: string) => void;
  onSelectionChange?: (selection: EditorSelection | null) => void;
  onError?: (error: EditorError) => void;
}

export interface MermaidVisualEditor {
  getValue(): string;
  setValue(value: string): void;
  destroy(): void;
}

export class DestroyedEditorError extends Error {
  constructor() {
    super('This Mermaid visual editor has been destroyed.');
    this.name = 'DestroyedEditorError';
  }
}
