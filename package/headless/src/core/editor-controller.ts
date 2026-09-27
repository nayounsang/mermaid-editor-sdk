import type { DiagramAction, ChangeOrigin } from './diagram-model';
import { DiagramSession } from './diagram-session';

export class EditorController {
  readonly session: DiagramSession;
  #onChange: ((value: string) => void) | undefined;
  #unsubscribe: (() => void) | undefined;
  #lastPublishedSource: string;

  constructor(initialSource: string, onChange?: (value: string) => void) {
    this.session = new DiagramSession(initialSource);
    this.#lastPublishedSource = initialSource;
    this.#onChange = onChange;
  }

  setOnChange(callback?: (value: string) => void): void {
    this.#onChange = callback;
  }

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

  stop(): void {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
  }

  setHostValue(source: string): void {
    this.session.setSource(source, 'host');
    this.#lastPublishedSource = source;
  }

  setSource(source: string, origin: ChangeOrigin = 'source-editor'): boolean {
    return this.session.setSource(source, origin);
  }

  dispatch(action: DiagramAction): string | undefined {
    return this.session.dispatch(action);
  }

  undo(): string | undefined {
    return this.session.undo();
  }

  redo(): string | undefined {
    return this.session.redo();
  }
}
