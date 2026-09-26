import './styles/editor.css';

export { createMermaidVisualEditor } from './runtime/create-editor';
export type {
  EditorError,
  EditorSelection,
  MermaidVisualEditor,
  MermaidVisualEditorOptions,
} from './runtime/types';
export type { DiagramType } from './diagrams/capability';
