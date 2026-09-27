import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { addJourneyPaletteItem, type JourneyPaletteItemId } from './journey-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');
beforeAll(async () => { await mermaid.parse('journey\n'); });

describe('Journey source mutations', () => {
  it('preserves metadata and existing section/task/score/actor order when appending a task', async () => {
    const after = addJourneyPaletteItem(fixture('journey-preservation.before.mmd'), 'multi-actor');
    expect(after).toBe(fixture('journey-preservation.after.mmd'));
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(after);
    const db = diagram.db as unknown as { getTasks(): unknown[] };
    expect(db.getTasks()).toMatchObject([
      { section: 'Search', task: 'Visit site', score: 5, people: ['User'] },
      { section: 'Search', task: 'Compare prices', score: 0, people: ['User'] },
      { section: 'Book', task: 'Enter details', score: 2, people: ['User', 'System'] },
      { section: 'Book', task: 'Task name', score: 3, people: ['User', 'System'] },
    ]);
  });

  it.each(['title', 'section', 'task', 'multi-actor'] as const)('adds the %s tool to an empty Journey', async (id) => {
    await mermaid.parse(addJourneyPaletteItem('journey\n', id));
  });

  it('chooses a new section name for repeated additions', async () => {
    const source = 'journey\n    section Phase\n    Existing: 4: User\n';
    const after = addJourneyPaletteItem(addJourneyPaletteItem(source, 'section'), 'section');
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(after);
    const db = diagram.db as unknown as { getSections(): string[] };
    expect(db.getSections()).toEqual(['Phase', 'Phase 2', 'Phase 3']);
  });

  it.each(['\r\n', '\n', '\r'])('preserves %j line endings and the absence of a final newline', (ending) => {
    const source = `journey${ending}\tsection Plan`;
    expect(addJourneyPaletteItem(source, 'task')).toBe(`${source}${ending}\tTask name: 5: Actor`);
  });

  it('keeps section-looking text inside accessibility metadata out of name generation', async () => {
    const source = 'journey\naccDescr {\nsection Phase\n}\n';
    const after = addJourneyPaletteItem(source, 'section');
    expect(after).toBe(`${source}    section Phase\n`);
    await mermaid.parse(after);
  });

  it('preserves a hash comment in the diagram body', async () => {
    const source = 'journey\n# source note\n';
    const after = addJourneyPaletteItem(source, 'task');
    expect(after.startsWith(source)).toBe(true);
    await mermaid.parse(after);
  });

  it('rejects an existing title without changing the source', () => {
    expect(() => addJourneyPaletteItem('journey\ntitle Existing\n', 'title')).toThrow(AmbiguousSourceMutationError);
  });

  it.each(['flowchart LR\nA-->B', 'journey\naccDescr {\n', 'journey\n%%{init: {\n'])('rejects mismatched or unfinished source %j', (source) => {
    expect(() => addJourneyPaletteItem(source, 'task')).toThrow(AmbiguousSourceMutationError);
  });

  it('rejects an unknown item', () => {
    expect(() => addJourneyPaletteItem('journey\n', 'bad' as JourneyPaletteItemId)).toThrow(AmbiguousSourceMutationError);
  });
});
