import type { GraphPaletteEntry } from '../types';

export const flowchartPalette: readonly GraphPaletteEntry[] = [
  { group: 'Nodes', label: 'Process box', icon: '[ ]', action: { type: 'create-node', shape: 'rect' } },
  { group: 'Nodes', label: 'Decision', icon: '{ }', action: { type: 'create-node', shape: 'diamond' } },
  { group: 'Nodes', label: 'Rounded', icon: '( )', action: { type: 'create-node', shape: 'round' } },
  { group: 'Nodes', label: 'Circle', icon: '(( ))', action: { type: 'create-node', shape: 'circle' } },
  { group: 'Nodes', label: 'Stadium', icon: '([ ])', action: { type: 'create-node', shape: 'stadium' } },
  { group: 'Nodes', label: 'Subroutine', icon: '[[ ]]', action: { type: 'create-node', shape: 'subroutine' } },
  { group: 'Nodes', label: 'Database', icon: '[( )]', action: { type: 'create-node', shape: 'database' } },
  { group: 'Nodes', label: 'Hexagon', icon: '{{ }}', action: { type: 'create-node', shape: 'hexagon' } },
  { group: 'Edges', label: 'Relationship', icon: '→', action: { type: 'create-edge', source: 'A', target: 'B', operator: '-->' } },
  { group: 'Containers', label: 'Subgraph', icon: '{ }', action: { type: 'create-subgraph' } },
];
