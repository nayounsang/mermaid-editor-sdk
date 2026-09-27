import { createPaletteAdapter } from './palette-adapter';
import { addGitgraphPaletteItem, gitgraphPalette } from '@mermaid-editor/headless';

export const gitgraphAdapter = createPaletteAdapter('gitgraph', gitgraphPalette, addGitgraphPaletteItem);
