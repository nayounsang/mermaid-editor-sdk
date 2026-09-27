import { createPaletteAdapter } from './palette-adapter';
import { addMindmapPaletteItem, mindmapPalette } from '@mermaid-editor/headless';

export const mindmapAdapter = createPaletteAdapter('mindmap', mindmapPalette, addMindmapPaletteItem);
