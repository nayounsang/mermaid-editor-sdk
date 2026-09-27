import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { addPiePaletteItem, listPieSlices, setPieSliceLabel, setPieSliceValue, type PiePaletteItemId } from './pie-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');

async function renderedSections(source: string): Promise<Map<string, number>> {
  const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
  return (diagram.db as unknown as { getSections(): Map<string, number> }).getSections();
}

beforeAll(async () => { await mermaid.parse('pie\n"A":1\n'); });

describe('Pie source mutations', () => {
  it('preserves surrounding source through label and value edits followed by insertion', async () => {
    const before = fixture('pie-preservation.before.mmd');
    const after = addPiePaletteItem(setPieSliceValue(setPieSliceLabel(before, 'Safari', 'Safari "Mobile"'), 'Safari "Mobile"', 21), 'slice');
    expect(after).toBe(fixture('pie-preservation.after.mmd'));
    const sections = await renderedSections(after);
    expect([...sections]).toEqual([
      ['Chrome', 65], ['Safari "Mobile"', 21], ['Firefox', 9], ['Edge', 5], ['Label', 25],
    ]);
  });

  it.each(['title', 'slice'] as const)('adds the %s snippet as parseable source', async (itemId) => {
    await mermaid.parse(addPiePaletteItem('pie\n    "Existing" : 1\n', itemId));
  });

  it('gives consecutive additions distinct labels recognized by Mermaid', async () => {
    const once = addPiePaletteItem('pie\n', 'slice');
    const twice = addPiePaletteItem(once, 'slice');
    const sections = await renderedSections(twice);
    expect([...sections]).toEqual([['Label', 25], ['Label 2', 25]]);
  });

  it('does not treat accessibility text or directive content as slices', async () => {
    const source = '%%{init: {"theme": "dark"}}%%\npie showData\naccDescr {\n"Detail": 1\ntitle description only\n}\n"A": 3\n';
    expect(listPieSlices(source).map(({ label }) => label)).toEqual(['A']);
    expect(() => setPieSliceValue(source, 'Detail', 2)).toThrow(AmbiguousSourceMutationError);
    const after = setPieSliceValue(source, 'A', 4);
    expect(after).toBe(source.replace('"A": 3', '"A": 4'));
    await mermaid.parse(addPiePaletteItem(after, 'title'));
  });

  it('edits a multiline label without interpreting its contents as statements', async () => {
    const source = 'pie\n"First\nline": 3\n"Second": 2\n';
    const after = setPieSliceValue(source, 'First\nline', 4);
    expect(after).toBe(source.replace(': 3', ': 4'));
    const sections = await renderedSections(after);
    expect(sections.get('First\nline')).toBe(4);
  });

  it('retains CRLF during edits and insertion', () => {
    const source = 'pie\r\n    "A" : 1\r\n';
    expect(addPiePaletteItem(setPieSliceValue(source, 'A', 2), 'slice')).toBe('pie\r\n    "A" : 2\r\n    "Label" : 25\r\n');
  });

  it.each([0, 0.0000001, 1e21])('writes %s without unsupported exponent syntax', async (value) => {
    const source = setPieSliceValue('pie\n"A": 1\n', 'A', value);
    const sections = await renderedSections(source);
    expect(sections.get('A')).toBe(value);
  });

  it.each(['Quote " and slash \\', 'Line\nBreak', 'Tab\tLabel'])('round-trips the renamed label %j through Mermaid', async (label) => {
    const after = setPieSliceLabel('pie\n"A":1\n', 'A', label);
    const sections = await renderedSections(after);
    expect([...sections.keys()]).toEqual([label]);
  });

  it.each(['pie title Existing\n"A":1\n', 'pie showData\ntitle Existing\n"A":1\n'])('rejects a duplicate title in %j', (source) => {
    expect(() => addPiePaletteItem(source, 'title')).toThrow(AmbiguousSourceMutationError);
  });

  it.each([Number.NaN, Infinity, -1])('rejects invalid value %s', (value) => {
    expect(() => setPieSliceValue('pie\n"A":1\n', 'A', value)).toThrow(AmbiguousSourceMutationError);
  });

  it.each(['pie\n"B":1\n', 'pie\n"A":1\n"A":2\n'])('rejects a missing or ambiguous target in %j', (source) => {
    expect(() => setPieSliceValue(source, 'A', 2)).toThrow(AmbiguousSourceMutationError);
  });

  it('rejects non-Pie source', () => {
    expect(() => addPiePaletteItem('flowchart LR\nA-->B\n', 'slice')).toThrow(AmbiguousSourceMutationError);
  });

  it('rejects unknown palette items', () => {
    expect(() => addPiePaletteItem('pie\n', 'unknown' as PiePaletteItemId)).toThrow(AmbiguousSourceMutationError);
  });
});
