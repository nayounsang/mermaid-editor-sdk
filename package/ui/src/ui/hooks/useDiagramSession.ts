import { useCallback } from 'react';
import { useStore } from 'zustand';
import type { ChangeOrigin, DiagramAction, SessionSnapshot } from '@mermaid-editor-sdk/headless';
import { useEditorController } from '../context/editor-session-context';

/** Observable session values and editing actions returned by `useDiagramSession`. */
export interface DiagramSessionBindings {
  /** Current session state. */
  readonly snapshot: SessionSnapshot;
  /** Applies a diagram action and returns the resulting source when changed. */
  readonly dispatch: (action: DiagramAction) => string | undefined;
  /** Reverts the last source change. */
  readonly undo: () => string | undefined;
  /** Reapplies the next source change. */
  readonly redo: () => string | undefined;
  /** Replaces source and optionally records its change origin. Defaults to `'source-editor'`. */
  readonly setSource: (source: string, origin?: ChangeOrigin) => boolean;
}

/** Subscribes to and returns the current editor session and its editing actions. */
export function useDiagramSession(): DiagramSessionBindings {
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
