import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { addQuadrantPaletteItem, type QuadrantPaletteItemId, quadrantPalette } from './quadrant-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');
beforeAll(async () => { await mermaid.parse('quadrantChart\n    Point: [0.5, 0.5]\n'); });
afterEach(async () => { await mermaid.parse('quadrantChart\n    Reset: [0.5, 0.5]\n'); });

describe('Quadrant source mutations', () => {
  it('matches the reference palette structure and snippets', () => {
    expect(quadrantPalette.flatMap(({ items }) => items.map(({ label, snippet }) => [label, snippet]))).toEqual([
      ['Title', 'title Chart title'], ['X-axis', 'x-axis Low --> High'], ['Y-axis', 'y-axis Low --> High'],
      ['Quadrant label', 'quadrant-1 Top right'], ['Data point', 'Label: [0.5, 0.5]'],
    ]);
  });

  it('preserves frontmatter, directives, labels, styles, and points while adding a unique point', async () => {
    const before = fixture('quadrant-metadata.before.mmd');
    const after = addQuadrantPaletteItem(before, 'point');
    expect(after).toBe(fixture('quadrant-metadata.after.mmd'));
    await mermaid.parse(after);
  });

  it.each(['title', 'x-axis', 'y-axis', 'quadrant-label', 'point'] as const)('adds %s to an empty Quadrant chart', async (id) => {
    const after = addQuadrantPaletteItem('quadrantChart\n', id);
    await mermaid.parse(after);
  });

  it('chooses unique point labels across styled points', () => {
    const source = 'quadrantChart\n    Label: [0.2, 0.3]\n    Label 2:::series: [0.4, 0.5]\n';
    expect(addQuadrantPaletteItem(source, 'point')).toBe(`${source}    Label 3: [0.5, 0.5]\n`);
  });

  it.each([
    ['title', 'title Existing'], ['x-axis', 'x-axis Left --> Right'], ['y-axis', 'y-axis Bottom --> Top'],
    ['quadrant-label', 'quadrant-1 Existing'],
  ] as const)('rejects a duplicate %s statement', (id, line) => {
    expect(() => addQuadrantPaletteItem(`quadrantChart\n    ${line}\n`, id)).toThrow(AmbiguousSourceMutationError);
  });

  it.each(['\r\n', '\n', '\r'])('preserves %j line endings and missing final newline', (ending) => {
    const source = `quadrantChart${ending}\tPoint: [0.2, 0.3]`;
    expect(addQuadrantPaletteItem(source, 'point')).toBe(`${source}${ending}\tLabel: [0.5, 0.5]`);
  });

  it('rejects mismatched diagrams, unfinished metadata, and unknown palette IDs', () => {
    expect(() => addQuadrantPaletteItem('pie\n', 'point')).toThrow(AmbiguousSourceMutationError);
    expect(() => addQuadrantPaletteItem('quadrantChart\n%%{init: {\n', 'point')).toThrow(AmbiguousSourceMutationError);
    expect(() => addQuadrantPaletteItem('quadrantChart\n', 'bad' as QuadrantPaletteItemId)).toThrow(AmbiguousSourceMutationError);
  });
});
