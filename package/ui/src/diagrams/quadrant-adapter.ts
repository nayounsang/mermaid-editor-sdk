import { createPaletteAdapter } from './palette-adapter';
import { addQuadrantPaletteItem, quadrantPalette } from '@mermaid-editor-sdk/headless';

export const quadrantAdapter = createPaletteAdapter('quadrant', quadrantPalette, addQuadrantPaletteItem);
