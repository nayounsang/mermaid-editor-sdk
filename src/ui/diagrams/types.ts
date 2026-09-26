import type { DiagramAction } from '../../core/diagram-model';

export interface GraphPaletteEntry {
  readonly group: string;
  readonly label: string;
  readonly icon: string;
  readonly action: DiagramAction;
}
