import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';

export type GanttPaletteItemId =
  | 'title'
  | 'date-format'
  | 'section'
  | 'task'
  | 'after-previous'
  | 'milestone'
  | 'critical'
  | 'done'
  | 'active';

export interface GanttPaletteItem {
  id: GanttPaletteItemId;
  label: string;
  icon: string;
  snippet: string;
}

export interface GanttPaletteGroup {
  title: string;
  items: readonly GanttPaletteItem[];
}

export const ganttPalette: readonly GanttPaletteGroup[] = [
  { title: 'Structure', items: [
    { id: 'title', label: 'Title', icon: 't', snippet: 'title Project plan' },
    { id: 'date-format', label: 'Date format', icon: 'fmt', snippet: 'dateFormat YYYY-MM-DD' },
    { id: 'section', label: 'Section', icon: '§', snippet: 'section Phase name' },
  ] },
  { title: 'Tasks', items: [
    { id: 'task', label: 'Task', icon: 'task', snippet: 'Task name :mveTask1, 5d' },
    { id: 'after-previous', label: 'After previous', icon: '→task', snippet: 'Task name : 7d' },
    { id: 'milestone', label: 'Milestone', icon: '◆', snippet: 'Milestone :milestone, 0d' },
    { id: 'critical', label: 'Critical', icon: '!', snippet: 'Critical task :crit, 3d' },
    { id: 'done', label: 'Done', icon: '✓', snippet: 'Past task :done, 5d' },
    { id: 'active', label: 'Active', icon: '▶', snippet: 'Current task :active, 5d' },
  ] },
];

const itemById = new Map(ganttPalette.flatMap(({ items }) => items.map((item) => [item.id, item] as const)));
const commentLine = /^[\t ]*(?:%%|%)/;

function linesOf(source: string): Array<{ text: string; start: number; end: number }> {
  const result: Array<{ text: string; start: number; end: number }> = [];
  const pattern = /[^\r\n]*(?:\r\n|\n|\r|$)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    if (!match[0]) break;
    const ending = /(?:\r\n|\n|\r)$/.exec(match[0])?.[0] ?? '';
    result.push({ text: match[0].slice(0, -ending.length || undefined), start: match.index, end: match.index + match[0].length - ending.length });
  }
  return result;
}

function contentLines(source: string): Array<{ text: string; start: number; end: number }> {
  let frontmatter = false;
  let frontmatterSeen = false;
  return linesOf(source).filter((line, index) => {
    const text = line.text.trim().replace(/^\uFEFF/, '');
    if (index === 0 && text === '---' && !frontmatterSeen) {
      frontmatter = true;
      frontmatterSeen = true;
      return false;
    }
    if (frontmatter) {
      if (text === '---' || text === '...') frontmatter = false;
      return false;
    }
    return !commentLine.test(line.text);
  });
}

function assertGantt(source: string): void {
  const header = contentLines(source).find((line) => line.text.trim());
  if (!header || !/^\uFEFF?\s*gantt\b/i.test(header.text)) {
    throw new AmbiguousSourceMutationError('A Gantt palette edit requires a gantt source.');
  }
}

function taskId(source: string): string {
  const used = new Set([...source.matchAll(/\bmveTask(\d+)\b/g)].map((match) => Number(match[1])));
  let index = 1;
  while (used.has(index)) index++;
  return `mveTask${index}`;
}

function previousTaskId(source: string): string | undefined {
  const directives = /^(?:title|dateFormat|axisFormat|tickInterval|excludes|includes|todayMarker|weekday|weekend|vert|click|link|accTitle|accDescr)\b/i;
  let lastTaskId: string | undefined;
  let hasTask = false;
  for (const line of contentLines(source)) {
    if (directives.test(line.text.trim())) continue;
    const colon = line.text.lastIndexOf(':');
    if (colon < 0) continue;
    hasTask = true;
    const values = line.text.slice(colon + 1).split(',').map((value) => value.trim());
    let index = 0;
    while (/^(?:active|done|crit|milestone)$/i.test(values[index] ?? '')) index++;
    const candidate = values[index] ?? '';
    lastTaskId = /^(?:after\b|\d)/i.test(candidate)
      || !/^[\p{L}_][\p{L}\p{N}_.-]*$/u.test(candidate)
      || !values[index + 1]
      ? undefined : candidate;
  }
  return hasTask ? lastTaskId : undefined;
}

function indentation(source: string): string {
  for (const line of contentLines(source)) {
    if (!line.text.trim() || /^\s*\uFEFF?gantt\b/i.test(line.text)) continue;
    return /^[\t ]*/.exec(line.text)?.[0] ?? '';
  }
  return '    ';
}

export function addGanttPaletteItem(source: string, itemId: GanttPaletteItemId): string {
  assertGantt(source);
  const item = itemById.get(itemId);
  if (!item) throw new AmbiguousSourceMutationError('The Gantt palette item is not supported.');
  let snippet = item.snippet;
  if (itemId === 'task') snippet = item.snippet.replace('mveTask1', taskId(source));
  else if (itemId === 'after-previous') {
    const previousId = previousTaskId(source);
    snippet = previousId ? `Task name :after ${previousId}, 7d` : item.snippet;
  }
  const line = `${indentation(source)}${snippet}`;
  return appendSourceLines(source, [line], 'gantt');
}
