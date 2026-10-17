import type { EditableDiagramType, EditorSelection } from '@mermaid-editor-sdk/headless';
export type { EditorSelection } from '@mermaid-editor-sdk/headless';

/** Structured failure reported by the editor through `onError`. */
export interface EditorError {
  /** Failure category reported by the editor. */
  code: 'parse' | 'render' | 'mutation' | 'save' | 'destroyed';
  /** Human-readable error summary. */
  message: string;
  /** Original error or rejection value, when available. */
  cause?: unknown;
}

/** Initial value and event callbacks for the imperative visual editor. */
export interface MermaidVisualEditorOptions {
  /** Initial Mermaid source. */
  value: string;
  /** Called when the user edits the source; programmatic source updates do not invoke it. */
  onChange?: (value: string) => void;
  /** Called after a new diagram type is selected and its default source is applied. */
  onChangeDiagramType?: (diagramType: EditableDiagramType) => void;
  /** Called when the selection changes or clears. */
  onSelectionChange?: (selection: EditorSelection | null) => void;
  /** Receives parse, render, mutation, save, or lifecycle errors. */
  onError?: (error: EditorError) => void;
  /** Called by Save with the current source. */
  onSave?: (currentSource: string) => void | Promise<void>;
  /** Called after Reset with the resulting source. */
  onReset?: (nextSource: string) => void | Promise<void>;
  /** Called after removal with the selection and resulting source. */
  onRemove?: (selection: EditorSelection, nextSource: string) => void | Promise<void>;
}

/** Imperative controls for an editor mounted with `createMermaidVisualEditor`. */
export interface MermaidVisualEditor {
  /** Returns the current Mermaid source. */
  getValue(): string;
  /** Replaces the current Mermaid source. */
  setValue(value: string): void;
  /** Destroys the editor and releases its resources. */
  destroy(): void;
}

export class DestroyedEditorError extends Error {
  constructor() {
    super('This Mermaid visual editor has been destroyed.');
    this.name = 'DestroyedEditorError';
  }
}
