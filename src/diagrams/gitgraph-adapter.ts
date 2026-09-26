import { createPaletteAdapter } from './palette-adapter';
import { addGitgraphPaletteItem, gitgraphPalette } from '../source/gitgraph-mutations';

export const gitgraphAdapter = createPaletteAdapter('gitgraph', gitgraphPalette, addGitgraphPaletteItem);
