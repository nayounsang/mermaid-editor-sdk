import { createContext, useContext, type ReactNode } from 'react';
import type { EditorController } from '@mermaid-editor-sdk/headless';

const EditorSessionContext = createContext<EditorController | null>(null);

export interface EditorSessionProviderProps {
  readonly controller: EditorController;
  readonly children: ReactNode;
}

export function EditorSessionProvider({ controller, children }: EditorSessionProviderProps) {
  return <EditorSessionContext.Provider value={controller}>{children}</EditorSessionContext.Provider>;
}

export function useEditorController(): EditorController {
  const controller = useContext(EditorSessionContext);
  if (!controller) throw new Error('MermaidEditor must be rendered inside an EditorSessionProvider.');
  return controller;
}
