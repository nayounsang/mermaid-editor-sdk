import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { addGanttPaletteItem, ganttPalette, type GanttPaletteItemId } from './gantt-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');

describe('Gantt source mutations', () => {
  it('adds a task while preserving frontmatter, comments, date format, section, and dependencies', async () => {
    const before = fixture('gantt-preservation.before.mmd');
    const after = addGanttPaletteItem(before, 'critical');
    expect(after).toBe(fixture('gantt-preservation.after.mmd'));
    await Promise.all([mermaid.parse(before), mermaid.parse(after)]);
  });

  it('adds every palette snippet as parseable Gantt source', async () => {
    const source = 'gantt\n    dateFormat YYYY-MM-DD\n    section Existing\n    Existing task :existing, 2026-01-01, 2d\n';
    const itemIds = ganttPalette.flatMap(({ items }) => items.map(({ id }) => id));
    for (const itemId of itemIds) {
      const updated = addGanttPaletteItem(source, itemId);
      await mermaid.parse(updated);
    }
    expect(addGanttPaletteItem(source, 'after-previous')).toContain('Task name :after existing, 7d');
    await mermaid.parse(addGanttPaletteItem('gantt\n', 'after-previous'));
  });

  it('creates unique task IDs and retains CRLF line endings', async () => {
    const source = 'gantt\r\n    dateFormat YYYY-MM-DD\r\n    section Work\r\n    First :mveTask1, 2026-01-01, 2d\r\n';
    const once = addGanttPaletteItem(source, 'task');
    const twice = addGanttPaletteItem(once, 'task');
    expect(once).toContain('Task name :mveTask2, 5d\r\n');
    expect(twice).toContain('Task name :mveTask3, 5d\r\n');
    expect(twice.replace(/\r\n/g, '')).not.toContain('\n');
    await mermaid.parse(twice);
  });

  it('does not link After previous to an older ID when the latest task has no ID', async () => {
    const source = 'gantt\n    section Work\n    First :first, 2026-01-01, 2d\n    Second :2026-01-03, 3d\n';
    const updated = addGanttPaletteItem(source, 'after-previous');
    expect(updated).toContain('Task name : 7d');
    expect(updated).not.toContain('after first');
    await mermaid.parse(updated);
  });

  it('rejects non-Gantt sources and unknown palette items without changing them', () => {
    const source = 'flowchart LR\nA-->B\n';
    expect(() => addGanttPaletteItem(source, 'task')).toThrow(AmbiguousSourceMutationError);
    expect(() => addGanttPaletteItem('gantt\n', 'unknown' as GanttPaletteItemId)).toThrow(AmbiguousSourceMutationError);
    expect(source).toBe('flowchart LR\nA-->B\n');
  });
});
