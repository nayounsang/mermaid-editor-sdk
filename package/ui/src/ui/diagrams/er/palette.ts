import type { GraphPaletteEntry } from '../types';

export const erPalette: readonly GraphPaletteEntry[] = [
  { group: 'Entities', label: 'Entity with fields', icon: '▤', action: { type: 'create-node', withDefaultAttribute: true } },
  { group: 'Entities', label: 'Empty entity', icon: 'E', action: { type: 'create-node' } },
  { group: 'Relationships', label: 'Relationship', icon: '→', action: { type: 'create-edge', source: '', target: '', label: 'relates' } },
];
