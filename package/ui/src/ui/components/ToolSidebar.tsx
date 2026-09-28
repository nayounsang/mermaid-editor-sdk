import type { ComponentType } from 'react';
import type { DiagramAction, RendererModel } from '@mermaid-editor-sdk/headless';
import { DiagramPalette, type DiagramPaletteProps, type EdgeConnectionOptions } from './DiagramPalette';
import type { EditableDiagramType } from '@mermaid-editor-sdk/headless';

export interface ToolSidebarProps {
  readonly model: RendererModel;
  readonly dispatch: (action: DiagramAction) => string | undefined;
  readonly pendingConnection?: { readonly diagramType: EditableDiagramType; readonly source?: string };
  readonly onArmConnection: (options: EdgeConnectionOptions | null) => void;
  readonly paletteComponent?: ComponentType<DiagramPaletteProps>;
}

export function ToolSidebar({ model, dispatch, pendingConnection, onArmConnection, paletteComponent: Palette = DiagramPalette }: ToolSidebarProps) {
  return (
    <div className="mve-tool-sidebar">
      <Palette model={model} dispatch={dispatch} {...(pendingConnection ? { pendingConnection } : {})} onArmConnection={onArmConnection} />
    </div>
  );
}
