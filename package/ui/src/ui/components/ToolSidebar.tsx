import type { DiagramAction, RendererModel } from '@mermaid-editor/headless';
import { DiagramPalette, type EdgeConnectionOptions } from './DiagramPalette';
import type { EditableDiagramType } from '@mermaid-editor/headless';

export interface ToolSidebarProps {
  readonly model: RendererModel;
  readonly dispatch: (action: DiagramAction) => string | undefined;
  readonly pendingConnection?: { readonly diagramType: EditableDiagramType; readonly source?: string };
  readonly onArmConnection: (options: EdgeConnectionOptions | null) => void;
}

export function ToolSidebar({ model, dispatch, pendingConnection, onArmConnection }: ToolSidebarProps) {
  return (
    <div className="mve-tool-sidebar">
      <DiagramPalette model={model} dispatch={dispatch} {...(pendingConnection ? { pendingConnection } : {})} onArmConnection={onArmConnection} />
    </div>
  );
}
