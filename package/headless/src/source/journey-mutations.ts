import type { PaletteGroup } from './palette-source';
import { AmbiguousSourceMutationError } from './source-document';
import { appendDiagramLine, diagramLines } from './palette-source';

/** Identifier of a journey palette item. */
export type JourneyPaletteItemId = 'title' | 'section' | 'task' | 'multi-actor';

/** Palette items exported for journey diagrams. */
export const journeyPalette: readonly PaletteGroup<JourneyPaletteItemId>[] = [
  { title: 'Structure', items: [
    { id: 'title', label: 'Title', icon: 't', snippet: 'title My journey' },
    { id: 'section', label: 'Section', icon: '§', snippet: 'section Phase' },
  ] },
  { title: 'Tasks', items: [
    { id: 'task', label: 'Task', icon: '★', snippet: 'Task name: 5: Actor' },
    { id: 'multi-actor', label: 'Multi-actor', icon: '★★', snippet: 'Task name: 3: User, System' },
  ] },
];

const items = new Map(journeyPalette.flatMap(({ items }) => items.map((item) => [item.id, item])));

/**
 * Adds a journey palette item to the source.
 * @param source - Mermaid source to inspect or update.
 * @param id - Identifier of the diagram element.
 */
export function addJourneyPaletteItem(source: string, id: JourneyPaletteItemId): string {
  const lines = diagramLines(source, /^journey\b/i);
  const item = items.get(id);
  if (!item) throw new AmbiguousSourceMutationError('The Journey palette item is not supported.');
  if (id === 'title' && lines.some(({ text }) => /^\s*title\s/i.test(text))) {
    throw new AmbiguousSourceMutationError('A Journey title already exists; edit it in source instead.');
  }
  let snippet = item.snippet;
  if (id === 'section') {
    const used = new Set(lines.flatMap(({ text }) => /^\s*section\s+(.*)$/i.exec(text)?.[1]?.trim() ?? []));
    let name = 'Phase';
    let index = 2;
    while (used.has(name)) name = `Phase ${index++}`;
    snippet = `section ${name}`;
  }
  const indent = /^[\t ]*/.exec(lines[1]?.text ?? '    ')![0];
  return appendDiagramLine(source, snippet, indent, 'journey');
}
