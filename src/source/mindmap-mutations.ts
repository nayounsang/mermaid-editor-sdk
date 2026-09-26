import type { PaletteGroup } from './palette-source';
import { appendDiagramLine, diagramLines } from './palette-source';
import { AmbiguousSourceMutationError } from './source-document';

export type MindmapPaletteItemId = 'root' | 'branch' | 'square' | 'rounded' | 'cloud';

export const mindmapPalette: readonly PaletteGroup<MindmapPaletteItemId>[] = [
  { title: 'Nodes', items: [
    { id: 'root', label: 'Root (circle)', icon: '(( ))', snippet: 'root((Title))' },
    { id: 'branch', label: 'Branch', icon: '·', snippet: 'Branch label' },
    { id: 'square', label: 'Square node', icon: '[ ]', snippet: '[Square]' },
    { id: 'rounded', label: 'Rounded', icon: '( )', snippet: '(Rounded)' },
    { id: 'cloud', label: 'Cloud', icon: ')(', snippet: ')Cloud(' },
  ] },
];

const items = new Map(mindmapPalette.flatMap(({ items }) => items.map((item) => [item.id, item])));
const indentation = (text: string): string => /^[\t ]*/.exec(text)![0];

export function addMindmapPaletteItem(source: string, id: MindmapPaletteItemId): string {
  const lines = diagramLines(source, /^mindmap\b/i, { accessibilityMetadata: false, lineComment: /^%%/ });
  const item = items.get(id);
  if (!item) throw new AmbiguousSourceMutationError('The Mindmap palette item is not supported.');
  const headerTail = lines[0]!.text.replace(/^\s*mindmap\b/i, '');
  const root = headerTail.trim() && !headerTail.trim().startsWith('%%')
    ? headerTail : lines.slice(1).find(({ text }) => !text.trim().startsWith('::'))?.text;
  let indent = '  ';
  if (root !== undefined && root !== '') {
    const rootIndent = indentation(root);
    // Include all physical body lines, even label continuations. The smallest
    // positive depth cannot exceed a real child's depth, so insertion stays at
    // the root rather than accidentally attaching to the last nested branch.
    const depths = source.slice(lines[0]!.end).split(/\r\n|\r|\n/)
      .filter((line) => line.trim())
      .map(indentation).filter((prefix) => prefix.length > rootIndent.length);
    indent = depths.reduce((smallest, prefix) => prefix.length < smallest.length ? prefix : smallest,
      depths[0] ?? `${rootIndent}  `);
  }
  let snippet = item.snippet;
  if (id === 'root' && root) {
    const used = new Set(source.match(/\bmveNode\d+\b/g) ?? []);
    let index = 1;
    while (used.has(`mveNode${index}`)) index++;
    snippet = `mveNode${index}((Title))`;
  }
  return appendDiagramLine(source, snippet, indent, 'mindmap');
}
