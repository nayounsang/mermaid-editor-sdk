import type { ReactNode } from 'react';

export interface EditorShellProps {
  readonly sidebar: ReactNode;
  readonly canvas: ReactNode;
  readonly source: ReactNode;
  readonly selection: ReactNode;
  readonly status: ReactNode;
  readonly headerControls?: ReactNode;
  readonly title?: string | undefined;
  readonly actions?: ReactNode;
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  readonly className?: string | undefined;
}

export function EditorShell({ sidebar, canvas, source, selection, status, headerControls, title = 'Diagram', actions, onKeyDown, className = '' }: EditorShellProps) {
  return (
    <div className={`mve-root ${className}`.trim()} onKeyDown={onKeyDown}>
      <header className="mve-header"><strong>{title}</strong><div className="mve-header-controls">{headerControls}</div><div className="mve-header-actions">{actions}</div></header>
      {status}
      <main className="mve-workspace">
        {sidebar}
        <div className="mve-work-column">{canvas}{selection}{source}</div>
      </main>
    </div>
  );
}
