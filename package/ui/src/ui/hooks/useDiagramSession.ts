import { useCallback } from 'react';
import { useStore } from 'zustand';
import type { DiagramAction, ChangeOrigin } from '@mermaid-editor-sdk/headless';
import { useEditorController } from '../context/editor-session-context';

export function useDiagramSession() {
  const controller = useEditorController();
  const snapshot = useStore(controller.session.store);
  const dispatch = useCallback((action: DiagramAction) => controller.dispatch(action), [controller]);
  const undo = useCallback(() => controller.undo(), [controller]);
  const redo = useCallback(() => controller.redo(), [controller]);
  const setSource = useCallback((source: string, origin?: ChangeOrigin) => controller.setSource(source, origin), [controller]);
  return {
    snapshot,
    dispatch,
    undo,
    redo,
    setSource,
  };
}
