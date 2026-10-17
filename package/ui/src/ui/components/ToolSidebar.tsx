import type { ComponentType } from 'react';
import type { DiagramAction, RendererModel } from '@mermaid-editor-sdk/headless';
import { DiagramPalette, type DiagramPaletteProps, type EdgeConnectionOptions } from './DiagramPalette';
import type { EditableDiagramType } from '@mermaid-editor-sdk/headless';

export interface ToolSidebarProps {
  /** Current diagram model. */
  readonly model: RendererModel;
  /** Applies an editing action and returns the resulting source when changed. */
  readonly dispatch: (action: DiagramAction) => string | undefined;
  /** Active relationship creation; `source` is set after choosing its source node. */
  readonly pendingConnection?: { readonly diagramType: EditableDiagramType; readonly source?: string };
  /** Starts or cancels relationship creation. */
  readonly onArmConnection: (options: EdgeConnectionOptions | null) => void;
  /** Current flowchart edge operator and label. */
  readonly flowchartEdgeOptions?: DiagramPaletteProps['flowchartEdgeOptions'];
  /** Updates the flowchart edge operator and label. */
  readonly onFlowchartEdgeOptionsChange?: DiagramPaletteProps['onFlowchartEdgeOptionsChange'];
  /** Replaces the palette inside the SDK sidebar.
   * @default `DiagramPalette`
   */
  readonly paletteComponent?: ComponentType<DiagramPaletteProps>;
}

/** Sidebar containing the diagram palette and relationship tools. */
export function ToolSidebar({ model, dispatch, pendingConnection, onArmConnection, flowchartEdgeOptions, onFlowchartEdgeOptionsChange, paletteComponent: Palette = DiagramPalette }: ToolSidebarProps) {
  return (
    <div className="mve-tool-sidebar">
      <Palette model={model} dispatch={dispatch} {...(pendingConnection ? { pendingConnection } : {})} onArmConnection={onArmConnection}
        {...(flowchartEdgeOptions ? { flowchartEdgeOptions } : {})}
        {...(onFlowchartEdgeOptionsChange ? { onFlowchartEdgeOptionsChange } : {})} />
    </div>
  );
}
