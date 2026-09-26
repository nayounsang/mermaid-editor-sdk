import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { addMindmapPaletteItem, type MindmapPaletteItemId } from './mindmap-mutations';
import { AmbiguousSourceMutationError } from './source-document';

interface MindmapNode { descr: string; type: number; nodeId: string; children: MindmapNode[]; }
const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');
beforeAll(async () => { await mermaid.parse('mindmap\n  Root\n'); });
async function tree(source: string): Promise<MindmapNode> {
  const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
  return (diagram.db as unknown as { getMindmap(): MindmapNode }).getMindmap();
}

describe('Mindmap source mutations', () => {
  it('preserves the existing nested tree when adding a root child', async () => {
    const before = fixture('mindmap-nesting.before.mmd');
    const previous = await tree(before);
    const after = addMindmapPaletteItem(before, 'cloud');
    expect(after).toBe(fixture('mindmap-nesting.after.mmd'));
    const next = await tree(after);
    expect(next.children.slice(0, -1)).toEqual(previous.children);
    expect(next.children.at(-1)).toMatchObject({ descr: 'Cloud', type: 4, children: [] });
  });

  it.each([
    ['root', 3], ['branch', 0], ['square', 2], ['rounded', 1], ['cloud', 4],
  ] as const)('creates %s with its expected shape in an empty mindmap', async (id, type) => {
    const root = await tree(addMindmapPaletteItem('mindmap\n', id));
    expect(root.type).toBe(type);
    expect(root.children).toEqual([]);
  });

  it('adds circular nodes below an existing root without duplicating explicit IDs', async () => {
    const source = 'mindmap\n  root((Existing))\n';
    const after = addMindmapPaletteItem(addMindmapPaletteItem(source, 'root'), 'root');
    const root = await tree(after);
    expect(root.descr).toBe('Existing');
    expect(root.children.map(({ nodeId, type }) => [nodeId, type])).toEqual([['mveNode1', 3], ['mveNode2', 3]]);
  });

  it('keeps one-space nesting and appends beside the first-level branch', async () => {
    const source = 'mindmap\nRoot\n Child\n  Grandchild\n';
    const after = await tree(addMindmapPaletteItem(source, 'branch'));
    expect(after.children.map(({ descr }) => descr)).toEqual(['Child', 'Branch label']);
    expect(after.children[0]!.children[0]!.descr).toBe('Grandchild');
  });

  it('does not count lines inside a multiline label as new parents', async () => {
    const source = 'mindmap\n  root["First\n       second line"]\n    Child\n';
    const root = await tree(addMindmapPaletteItem(source, 'rounded'));
    expect(root.children.map(({ descr }) => descr)).toEqual(['Child', 'Rounded']);
  });

  it('treats accessibility-like text as a literal Mindmap node', async () => {
    const source = 'mindmap\n  accTitle: Literal\n    Child\n';
    const root = await tree(addMindmapPaletteItem(source, 'square'));
    expect(root.descr).toBe('accTitle: Literal');
    expect(root.children.map(({ descr }) => descr)).toEqual(['Child', 'Square']);
  });

  it('preserves a single-percent node as the root', async () => {
    const root = await tree(addMindmapPaletteItem('mindmap\n  %Root\n    Child\n', 'square'));
    expect(root.descr).toBe('%Root');
    expect(root.children.map(({ descr }) => descr)).toEqual(['Child', 'Square']);
  });

  it('supports a root on the header line', async () => {
    const root = await tree(addMindmapPaletteItem('mindmap root((Title))\n  Child\n', 'branch'));
    expect(root.children.map(({ descr }) => descr)).toEqual(['Child', 'Branch label']);
  });

  it('preserves CRLF and no final newline', () => {
    const source = 'mindmap\r\n  Root\r\n    Child';
    expect(addMindmapPaletteItem(source, 'square')).toBe(`${source}\r\n    [Square]`);
  });

  it('rejects a different diagram type', () => {
    expect(() => addMindmapPaletteItem('journey\n', 'root')).toThrow(AmbiguousSourceMutationError);
  });

  it('rejects an unknown item', () => {
    expect(() => addMindmapPaletteItem('mindmap\n', 'bad' as MindmapPaletteItemId)).toThrow(AmbiguousSourceMutationError);
  });
});
