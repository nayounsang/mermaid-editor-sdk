import type { GraphPaletteEntry } from '../types';

export const statePalette: readonly GraphPaletteEntry[] = [
  { group: 'States', label: 'State', icon: '▱', action: { type: 'create-node' } },
  { group: 'States', label: 'Composite', icon: '{ }', action: { type: 'insert-state-palette-entry', item: 'composite' } },
  { group: 'States', label: 'Choice', icon: '◇', action: { type: 'insert-state-palette-entry', item: 'choice' } },
  { group: 'Transitions', label: 'Transition', icon: '→', action: { type: 'create-edge', source: '', target: '' } },
  { group: 'Transitions', label: 'Start → state', icon: '[*]→', action: { type: 'insert-state-palette-entry', item: 'start-transition' } },
  { group: 'Transitions', label: 'State → end', icon: '→[*]', action: { type: 'insert-state-palette-entry', item: 'end-transition' } },
  { group: 'Notes', label: 'Note', icon: '▤', action: { type: 'insert-state-palette-entry', item: 'note' } },
];
