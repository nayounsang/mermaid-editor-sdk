import type { PaletteGroup } from './palette-source';
import { AmbiguousSourceMutationError } from './source-document';
import { appendDiagramLine, diagramLines } from './palette-source';

export type TimelinePaletteItemId = 'title' | 'section' | 'event';

export const timelinePalette: readonly PaletteGroup<TimelinePaletteItemId>[] = [
  { title: 'Structure', items: [
    { id: 'title', label: 'Title', icon: 't', snippet: 'title Timeline title' },
    { id: 'section', label: 'Section', icon: '§', snippet: 'section Era name' },
  ] },
  { title: 'Events', items: [
    { id: 'event', label: 'Event', icon: '|', snippet: '2026 : Event description' },
  ] },
];

const items = new Map(timelinePalette.flatMap(({ items }) => items.map((item) => [item.id, item])));

export function addTimelinePaletteItem(source: string, id: TimelinePaletteItemId): string {
  const lines = diagramLines(source, /^timeline\b/i);
  const item = items.get(id);
  if (!item) throw new AmbiguousSourceMutationError('The Timeline palette item is not supported.');
  if (id === 'title' && lines.some(({ text }) => /^\s*title\s/i.test(text))) {
    throw new AmbiguousSourceMutationError('A Timeline title already exists; edit it in source instead.');
  }

  let snippet = item.snippet;
  let indent = /^[\t ]*/.exec(lines[1]?.text ?? '    ')![0];
  if (id === 'section') {
    const used = new Set(lines.flatMap(({ text }) => /^\s*section\s+(.+?)\s*$/i.exec(text)?.[1] ?? []));
    let name = 'Era name';
    let suffix = 2;
    while (used.has(name)) name = `Era name ${suffix++}`;
    snippet = `section ${name}`;
  } else if (id === 'event') {
    const eventLine = lines.find(({ text }) => {
      const content = text.trim();
      return !/^(?:title|section|accTitle|accDescr)\b/i.test(content) && (content.startsWith(':') || content.includes(':'));
    });
    if (eventLine) indent = /^[\t ]*/.exec(eventLine.text)![0];
    else {
      const section = [...lines].reverse().find(({ text }) => /^\s*section\s+/i.test(text));
      if (section) indent = `${/^[\t ]*/.exec(section.text)![0]}    `;
    }
  }
  return appendDiagramLine(source, snippet, indent);
}
