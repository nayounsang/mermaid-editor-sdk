import { createPaletteAdapter } from './palette-adapter';
import { addTimelinePaletteItem, timelinePalette } from '../source/timeline-mutations';

export const timelineAdapter = createPaletteAdapter('timeline', timelinePalette, addTimelinePaletteItem);
