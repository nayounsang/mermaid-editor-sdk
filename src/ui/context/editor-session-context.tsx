import { createContext, useContext, type ReactNode } from 'react';
import type { EditorController } from '../../core/editor-controller';

const EditorSessionContext = createContext<EditorController | null>(null);

export function EditorSessionProvider({ controller, children }: {
  readonly controller: EditorController;
  readonly children: ReactNode;
}) {
  return <EditorSessionContext.Provider value={controller}>{children}</EditorSessionContext.Provider>;
}

export function useEditorController(): EditorController {
  const controller = useContext(EditorSessionContext);
  if (!controller) throw new Error('MermaidEditor must be rendered inside an EditorSessionProvider.');
  return controller;
}
