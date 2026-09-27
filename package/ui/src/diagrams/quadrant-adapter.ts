import { createPaletteAdapter } from './palette-adapter';
import { addQuadrantPaletteItem, quadrantPalette } from '@mermaid-editor/headless';

export const quadrantAdapter = createPaletteAdapter('quadrant', quadrantPalette, addQuadrantPaletteItem);
