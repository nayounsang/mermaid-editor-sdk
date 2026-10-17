import type { DiagramAction, ChangeOrigin } from './diagram-model';
import { DiagramSession } from './diagram-session';

export class EditorController {
  /** Underlying observable diagram session. */
  readonly session: DiagramSession;
  #onChange: ((value: string) => void) | undefined;
  #unsubscribe: (() => void) | undefined;
  #lastPublishedSource: string;

  /** Creates a controller for Mermaid source and an optional change callback.
   * @param initialSource - Initial Mermaid source.
   * @param onChange - Called when a non-host source change is published.
   */
  constructor(initialSource: string, onChange?: (value: string) => void) {
    this.session = new DiagramSession(initialSource);
    this.#lastPublishedSource = initialSource;
    this.#onChange = onChange;
  }

  /** Replaces the callback used for published source changes.
   * @param callback - Callback invoked when a non-host source change is published.
   */
  setOnChange(callback?: (value: string) => void): void {
    this.#onChange = callback;
  }

  /** Starts forwarding non-host session changes to the callback. */
  start(): void {
    if (this.#unsubscribe) return;
    this.#unsubscribe = this.session.subscribe(() => {
      const snapshot = this.session.getSnapshot();
      const source = snapshot.codeBlock.source;
      const changed = source !== this.#lastPublishedSource;
      this.#lastPublishedSource = source;
      if (changed && snapshot.origin !== 'host') this.#onChange?.(source);
    });
  }

  /** Stops forwarding session changes. */
  stop(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
  }

  /** Applies a host value without publishing it as an edit. */
  setHostValue(source: string): void {
    this.session.setSource(source, 'host');
    this.#lastPublishedSource = source;
  }

  /** Updates source and records its origin.
   * @param source - Mermaid source to apply.
   * @param origin - Change origin.
   */
  setSource(source: string, origin: ChangeOrigin = 'source-editor'): boolean {
    return this.session.setSource(source, origin);
  }

  /** Applies a diagram action and returns the new source when it changes.
   * @param action - Diagram action to validate and apply.
   */
  dispatch(action: DiagramAction): string | undefined {
    return this.session.dispatch(action);
  }

  /** Restores the previous source, if one is available. */
  undo(): string | undefined {
    return this.session.undo();
  }

  /** Restores the next source in history, if one is available. */
  redo(): string | undefined {
    return this.session.redo();
  }
}
