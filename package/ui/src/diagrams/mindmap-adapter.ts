import { createPaletteAdapter } from './palette-adapter';
import { addMindmapPaletteItem, mindmapPalette } from '@mermaid-editor-sdk/headless';

export const mindmapAdapter = createPaletteAdapter('mindmap', mindmapPalette, addMindmapPaletteItem);
