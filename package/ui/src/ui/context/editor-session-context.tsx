import { createContext, useContext, type ReactNode } from 'react';
import type { EditorController } from '@mermaid-editor-sdk/headless';

const EditorSessionContext = createContext<EditorController | null>(null);

export interface EditorSessionProviderProps {
  /** Controller whose session is shared with descendant editor components. */
  readonly controller: EditorController;
  /** Components that consume the session context. */
  readonly children: ReactNode;
}

/** Provides an editor controller to descendant UI components. */
export function EditorSessionProvider({ controller, children }: EditorSessionProviderProps) {
  return <EditorSessionContext.Provider value={controller}>{children}</EditorSessionContext.Provider>;
}

/** Returns the controller from the nearest `EditorSessionProvider`. */
export function useEditorController(): EditorController {
  const controller = useContext(EditorSessionContext);
  if (!controller) throw new Error('MermaidEditor must be rendered inside an EditorSessionProvider.');
  return controller;
}
