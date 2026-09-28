import { createPaletteAdapter } from './palette-adapter';
import { addTimelinePaletteItem, timelinePalette } from '@mermaid-editor-sdk/headless';

export const timelineAdapter = createPaletteAdapter('timeline', timelinePalette, addTimelinePaletteItem);
