import { createPaletteAdapter } from './palette-adapter';
import { addMindmapPaletteItem, mindmapPalette } from '../source/mindmap-mutations';

export const mindmapAdapter = createPaletteAdapter('mindmap', mindmapPalette, addMindmapPaletteItem);
