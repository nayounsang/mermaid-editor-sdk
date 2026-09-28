import { createPaletteAdapter } from './palette-adapter';
import { addGitgraphPaletteItem, gitgraphPalette } from '@mermaid-editor-sdk/headless';

export const gitgraphAdapter = createPaletteAdapter('gitgraph', gitgraphPalette, addGitgraphPaletteItem);
