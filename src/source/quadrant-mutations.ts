import type { PaletteGroup } from './palette-source';
import { AmbiguousSourceMutationError } from './source-document';
import { appendDiagramLine, diagramLines } from './palette-source';

export type QuadrantPaletteItemId = 'title' | 'x-axis' | 'y-axis' | 'quadrant-label' | 'point';

export const quadrantPalette: readonly PaletteGroup<QuadrantPaletteItemId>[] = [
  { title: 'Structure', items: [
    { id: 'title', label: 'Title', icon: 't', snippet: 'title Chart title' },
    { id: 'x-axis', label: 'X-axis', icon: 'x', snippet: 'x-axis Low --> High' },
    { id: 'y-axis', label: 'Y-axis', icon: 'y', snippet: 'y-axis Low --> High' },
  ] },
  { title: 'Quadrants', items: [
    { id: 'quadrant-label', label: 'Quadrant label', icon: 'Q', snippet: 'quadrant-1 Top right' },
  ] },
  { title: 'Points', items: [
    { id: 'point', label: 'Data point', icon: '•', snippet: 'Label: [0.5, 0.5]' },
  ] },
];

const items = new Map(quadrantPalette.flatMap(({ items }) => items.map((item) => [item.id, item] as const)));
const pointPattern = /^\s*(.*?)\s*(?::::([^:\r\n]+):|:)\s*\[/i;

function pointLabel(line: string): string | undefined {
  const match = pointPattern.exec(line);
  return match?.[1]?.trim();
}

export function addQuadrantPaletteItem(source: string, id: QuadrantPaletteItemId): string {
  const lines = diagramLines(source, /^quadrantChart\b/i);
  const item = items.get(id);
  if (!item) throw new AmbiguousSourceMutationError('The Quadrant palette item is not supported.');

  const pattern = id === 'title' ? /^\s*title(?:\s|$)/i
    : id === 'x-axis' ? /^\s*x-axis(?:\s|$)/i
      : id === 'y-axis' ? /^\s*y-axis(?:\s|$)/i
        : id === 'quadrant-label' ? /^\s*quadrant-1(?:\s|$)/i : undefined;
  if (pattern && lines.some(({ text }) => pattern.test(text))) {
    throw new AmbiguousSourceMutationError(`A Quadrant ${id} statement already exists; edit it in source instead.`);
  }

  let snippet = item.snippet;
  if (id === 'point') {
    const used = new Set(lines.flatMap(({ text }) => {
      const label = pointLabel(text);
      return label === undefined ? [] : [label];
    }));
    let label = 'Label';
    let suffix = 2;
    while (used.has(label)) label = `Label ${suffix++}`;
    snippet = `${label}: [0.5, 0.5]`;
  }

  const firstBodyLine = lines[1];
  const indent = firstBodyLine ? /^[\t ]*/.exec(firstBodyLine.text)![0] : '    ';
  return appendDiagramLine(source, snippet, indent, 'quadrant');
}
