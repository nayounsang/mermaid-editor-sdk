import { createPaletteAdapter } from './palette-adapter';
import { addJourneyPaletteItem, journeyPalette } from '@mermaid-editor/headless';

export const journeyAdapter = createPaletteAdapter('journey', journeyPalette, addJourneyPaletteItem);
