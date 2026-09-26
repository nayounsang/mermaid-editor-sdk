import type { GraphPaletteEntry } from '../types';

export const classPalette: readonly GraphPaletteEntry[] = [
  { group: 'Classes', label: 'Class block', icon: '▤', action: { type: 'create-node' } },
  { group: 'Classes', label: 'Empty class', icon: 'cls', action: { type: 'create-node', empty: true } },
  { group: 'Relationships', label: 'Relationship', icon: '→', action: { type: 'create-edge', source: '', target: '', operator: '-->' } },
];
