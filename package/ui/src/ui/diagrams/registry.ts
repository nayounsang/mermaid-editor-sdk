import type { EditableDiagramType } from '@mermaid-editor-sdk/headless';
import type { GraphPaletteEntry } from './types';
import { flowchartPalette } from './flowchart/palette';
import { classPalette } from './class/palette';
import { statePalette } from './state/palette';
import { erPalette } from './er/palette';

export const graphPalettes: Partial<Record<EditableDiagramType, readonly GraphPaletteEntry[]>> = {
  flowchart: flowchartPalette,
  class: classPalette,
  state: statePalette,
  er: erPalette,
};
