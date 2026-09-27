import type { EditorSelection } from '@mermaid-editor/headless';
export type { EditorSelection } from '@mermaid-editor/headless';

export interface EditorError {
  code: 'parse' | 'render' | 'mutation' | 'save' | 'destroyed';
  message: string;
  cause?: unknown;
}

export interface MermaidVisualEditorOptions {
  value: string;
  onChange?: (value: string) => void;
  onSelectionChange?: (selection: EditorSelection | null) => void;
  onError?: (error: EditorError) => void;
  onSave?: (currentSource: string) => void | Promise<void>;
  onReset?: (currentSource: string) => void | Promise<void>;
  onRemove?: (selection: EditorSelection, nextSource: string) => void | Promise<void>;
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
