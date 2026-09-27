import type { EditableDiagramType } from '@mermaid-editor/headless';

const sourcePaletteItemIds: Partial<Record<EditableDiagramType, Record<string, string>>> = {
  pie: { Title: 'title', Slice: 'slice' },
  journey: { Title: 'title', Section: 'section', Task: 'task', 'Multi-actor': 'multi-actor' },
  mindmap: { 'Root (circle)': 'root', Branch: 'branch', 'Square node': 'square', Rounded: 'rounded', Cloud: 'cloud' },
  gitgraph: { Commit: 'commit', 'Commit with id': 'commit-id', 'Tagged commit': 'tagged', Branch: 'branch', Checkout: 'checkout', Merge: 'merge' },
  timeline: { Title: 'title', Section: 'section', Event: 'event' },
  quadrant: { Title: 'title', 'X-axis': 'x-axis', 'Y-axis': 'y-axis', 'Quadrant label': 'quadrant-label', 'Data point': 'point' },
};

export function sourcePaletteItemId(type: EditableDiagramType, label: string): string | undefined {
  return sourcePaletteItemIds[type]?.[label];
}
