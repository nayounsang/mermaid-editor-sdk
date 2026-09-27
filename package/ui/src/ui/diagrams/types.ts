import type { DiagramAction } from '@mermaid-editor/headless';

export interface GraphPaletteEntry {
  readonly group: string;
  readonly label: string;
  readonly icon: string;
  readonly action: DiagramAction;
}
