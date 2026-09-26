import { createPaletteAdapter } from './palette-adapter';
import { addQuadrantPaletteItem, quadrantPalette } from '../source/quadrant-mutations';

export const quadrantAdapter = createPaletteAdapter('quadrant', quadrantPalette, addQuadrantPaletteItem);
