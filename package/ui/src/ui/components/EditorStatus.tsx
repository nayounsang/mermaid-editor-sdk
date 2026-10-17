import type { EditorError } from '../../runtime/types';

/** Render and editing states displayed by `EditorStatus`. */
export type EditorStatusState = 'loading' | 'empty' | 'error' | 'unsupported' | 'unknown' | 'source-only' | 'ready';

/** Accessible status message rendered alongside the editor. */
export interface EditorStatusProps {
  /** Status key used for the `data-state` attribute and accessibility role. */
  readonly state: EditorStatusState;
  /** Accessible status message. */
  readonly message: string;
  /** Optional structured error details; not rendered by this component. */
  readonly error?: EditorError;
}

/** Renders an accessible status message. */
export function EditorStatus({ state, message }: EditorStatusProps) {
  return <div className="mve-status" data-state={state} role={state === 'error' ? 'alert' : 'status'} aria-live="polite" aria-busy={state === 'loading'}>{message}</div>;
}
