import { createPaletteAdapter } from './palette-adapter';
import { addJourneyPaletteItem, journeyPalette } from '../source/journey-mutations';

export const journeyAdapter = createPaletteAdapter('journey', journeyPalette, addJourneyPaletteItem);
