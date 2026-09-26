import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { addTimelinePaletteItem, type TimelinePaletteItemId } from './timeline-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');
beforeAll(async () => { await mermaid.parse('timeline\n    2024 : Start\n'); });
afterEach(async () => { await mermaid.parse('timeline\n    2024 : Reset\n'); });

describe('Timeline source mutations', () => {
  it('preserves period order and multiline events while appending a period', async () => {
    const before = fixture('timeline-multiline.before.mmd');
    const after = addTimelinePaletteItem(before, 'event');
    expect(after).toBe(fixture('timeline-multiline.after.mmd'));
    await mermaid.parse(after);
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(after);
    const db = diagram.db as unknown as { getSections(): string[]; getTasks(): { task: string; events: string[] }[] };
    expect(db.getSections()).toEqual(['2020s']);
    expect(db.getTasks()).toMatchObject([
      { task: '2024 ', events: ['Launched service', 'Started with a pilot group', 'Opened to all customers'] },
      { task: '2025 ', events: ['Added regions', 'Expanded into Europe and Asia'] },
      { task: '2026 ', events: ['Event description'] },
    ]);
  });

  it.each(['title', 'section', 'event'] as const)('adds the %s tool to an empty Timeline', async (id) => {
    await mermaid.parse(addTimelinePaletteItem('timeline\n', id));
  });

  it('chooses a new section name on repeated insertion', async () => {
    const source = 'timeline\n    section Era name\n        2024 : Started\n';
    const after = addTimelinePaletteItem(addTimelinePaletteItem(source, 'section'), 'section');
    expect(after).toContain('section Era name 2');
    expect(after).toContain('section Era name 3');
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(after);
    const db = diagram.db as unknown as { getSections(): string[] };
    expect(db.getSections()).toEqual(['Era name', 'Era name 2', 'Era name 3']);
  });

  it('places an event under a section using the event indentation', async () => {
    const source = 'timeline\n    title Releases\n    section 2020s\n';
    const after = addTimelinePaletteItem(source, 'event');
    expect(after).toBe(`${source}        2026 : Event description\n`);
    await mermaid.parse(after);
  });

  it.each(['\r\n', '\n', '\r'])('preserves %j line endings without adding a final newline', (ending) => {
    const source = `timeline${ending}\t2024 : Start`;
    expect(addTimelinePaletteItem(source, 'event')).toBe(`${source}${ending}\t2026 : Event description`);
  });

  it('rejects a duplicate title, mismatched diagram, unfinished metadata, or unknown item', () => {
    expect(() => addTimelinePaletteItem('timeline\n    title Existing\n', 'title')).toThrow(AmbiguousSourceMutationError);
    expect(() => addTimelinePaletteItem('journey\n', 'event')).toThrow(AmbiguousSourceMutationError);
    expect(() => addTimelinePaletteItem('timeline\n%%{init: {\n', 'event')).toThrow(AmbiguousSourceMutationError);
    expect(() => addTimelinePaletteItem('timeline\n', 'bad' as TimelinePaletteItemId)).toThrow(AmbiguousSourceMutationError);
  });
});
