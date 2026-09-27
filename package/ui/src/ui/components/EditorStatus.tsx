import type { EditorError } from '../../runtime/types';

export type EditorStatusState = 'loading' | 'empty' | 'error' | 'unsupported' | 'unknown' | 'source-only' | 'ready';

export interface EditorStatusProps {
  readonly state: EditorStatusState;
  readonly message: string;
  readonly error?: EditorError;
}

export function EditorStatus({ state, message }: EditorStatusProps) {
  return <div className="mve-status" data-state={state} role={state === 'error' ? 'alert' : 'status'} aria-live="polite" aria-busy={state === 'loading'}>{message}</div>;
}
