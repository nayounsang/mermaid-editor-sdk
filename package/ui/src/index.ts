import './styles/editor.css';

export { MermaidEditor } from './ui/MermaidEditor';
export { useMermaidEditorParts } from './ui/MermaidEditor';
export type { MermaidEditorParts, MermaidEditorProps } from './ui/MermaidEditor';
export { createMermaidVisualEditor } from './runtime/create-editor';
export type {
  EditorError,
  EditorSelection,
  MermaidVisualEditor,
  MermaidVisualEditorOptions,
} from './runtime/types';
export { EditorController, SourceDocument } from '@mermaid-editor-sdk/headless';
export type {
  ChangeOrigin,
  DiagramAction,
  DiagramEdge,
  DiagramElement,
  DiagramNode,
  DiagramSemanticElement,
  DiagramType,
  EditableDiagramType,
  FlowchartNodeShape,
  RendererModel,
  SessionSnapshot,
} from '@mermaid-editor-sdk/headless';
export { EditorSessionProvider, useEditorController } from './ui/context/editor-session-context';
export type { EditorSessionProviderProps } from './ui/context/editor-session-context';
export { useDiagramSession } from './ui/hooks/useDiagramSession';
export { DiagramPalette } from './ui/components/DiagramPalette';
export type { DiagramPaletteProps, EdgeConnectionOptions } from './ui/components/DiagramPalette';
export { DiagramTypeSelect } from './ui/components/DiagramTypeSelect';
export type { DiagramTypeSelectProps } from './ui/components/DiagramTypeSelect';
export { EditorShell } from './ui/components/EditorShell';
export type { EditorShellComponent, EditorShellProps } from './ui/components/EditorShell';
export { EditorStatus } from './ui/components/EditorStatus';
export type { EditorStatusProps, EditorStatusState } from './ui/components/EditorStatus';
export { MermaidCanvas } from './ui/components/MermaidCanvas';
export type { MermaidCanvasHandle, MermaidCanvasProps } from './ui/components/MermaidCanvas';
export { SelectionEditor } from './ui/components/SelectionEditor';
export type { SelectionEditorProps } from './ui/components/SelectionEditor';
export { SourceEditor } from './ui/components/SourceEditor';
export type { SourceEditorProps } from './ui/components/SourceEditor';
export { ToolSidebar } from './ui/components/ToolSidebar';
export type { ToolSidebarProps } from './ui/components/ToolSidebar';
