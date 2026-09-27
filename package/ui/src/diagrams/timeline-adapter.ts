import { createPaletteAdapter } from './palette-adapter';
import { addTimelinePaletteItem, timelinePalette } from '@mermaid-editor/headless';

export const timelineAdapter = createPaletteAdapter('timeline', timelinePalette, addTimelinePaletteItem);
