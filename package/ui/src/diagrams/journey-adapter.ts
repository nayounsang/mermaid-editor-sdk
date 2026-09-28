import { createPaletteAdapter } from './palette-adapter';
import { addJourneyPaletteItem, journeyPalette } from '@mermaid-editor-sdk/headless';

export const journeyAdapter = createPaletteAdapter('journey', journeyPalette, addJourneyPaletteItem);
