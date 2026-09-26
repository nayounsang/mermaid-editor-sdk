import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { addGitgraphPaletteItem, type GitgraphPaletteItemId } from './gitgraph-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');
beforeAll(async () => { await mermaid.parse('gitGraph\n    commit\n'); });
afterEach(async () => { await mermaid.parse('%%{init: {"gitGraph": {"mainBranchName": "main"}}}%%\ngitGraph\n'); });

describe('Gitgraph source mutations', () => {
  it('preserves metadata, command order, branch names, commit IDs, tags, and merge references', async () => {
    const after = addGitgraphPaletteItem(fixture('gitgraph-preservation.before.mmd'), 'tagged');
    expect(after).toBe(fixture('gitgraph-preservation.after.mmd'));

    const diagram = await mermaid.mermaidAPI.getDiagramFromText(after);
    const db = diagram.db as unknown as {
      getBranchesAsObjArray(): { name: string }[];
      getCommitsArray(): { id: string; tags: string[]; parents: string[]; branch: string }[];
    };
    expect(db.getBranchesAsObjArray().map(({ name }) => name)).toEqual(['main', 'feature']);
    expect(db.getCommitsArray()).toMatchObject([
      { id: 'initial', tags: ['v0.1'], branch: 'main' },
      { id: 'work', branch: 'feature' },
      { id: 'fix', branch: 'main' },
      { id: 'integrate', tags: ['v0.2'], branch: 'main' },
      { tags: ['v1.0'], branch: 'main' },
    ]);
    expect(db.getCommitsArray()[3]!.parents).toEqual(['fix', 'work']);
    expect(db.getCommitsArray()[4]!.parents).toEqual(['integrate']);
  });

  it.each(['commit', 'commit-id', 'tagged', 'branch', 'checkout'] as const)(
    'adds the %s palette item to an empty Gitgraph source', async (id) => {
      const after = addGitgraphPaletteItem('gitGraph\n', id);
      expect(after).toContain(`    ${{
        commit: 'commit', 'commit-id': 'commit id: "msg"', tagged: 'commit tag: "v1.0"',
        branch: 'branch feature', checkout: 'checkout main',
      }[id]}`);
      await mermaid.parse(after);
    },
  );

  it('generates distinct commit IDs and branch names for repeated insertions', async () => {
    const withIds = addGitgraphPaletteItem(addGitgraphPaletteItem('gitGraph\n', 'commit-id'), 'commit-id');
    const withBranches = addGitgraphPaletteItem(addGitgraphPaletteItem('gitGraph\n', 'branch'), 'branch');
    expect(withIds).toContain('commit id: "msg"');
    expect(withIds).toContain('commit id: "msg2"');
    expect(withBranches).toContain('branch feature\n');
    expect(withBranches).toContain('branch feature2\n');
    await mermaid.parse(withIds);
    await mermaid.parse(withBranches);
  });

  it('avoids IDs and branch names already present in source', async () => {
    const source = 'gitGraph\n    commit id: "msg"\n    branch feature\n    commit id: "msg2"\n';
    const withId = addGitgraphPaletteItem(source, 'commit-id');
    const withBranch = addGitgraphPaletteItem(source, 'branch');
    expect(withId).toContain('commit id: "msg3"');
    expect(withBranch).toContain('branch feature2');
    await mermaid.parse(withId);
    await mermaid.parse(withBranch);
  });

  it('does not treat text inside a tag value as a commit ID field', async () => {
    const source = 'gitGraph\n    commit id: "release"\n    commit tag: "tag id: release"\n';
    const after = addGitgraphPaletteItem(source, 'commit-id');
    expect(after).toContain('commit id: "msg"');
    await mermaid.parse(after);
  });

  it('uses a configured main branch when inserting checkout', () => {
    const source = '%%{init: {"gitGraph": {"mainBranchName": "trunk"}}}%%\ngitGraph\n';
    expect(addGitgraphPaletteItem(source, 'checkout')).toBe(`${source}    checkout trunk\n`);
  });

  it('accepts a slash in an unquoted YAML main branch name', () => {
    const source = '---\nconfig:\n  gitGraph:\n    mainBranchName: release/trunk\n---\ngitGraph\n';
    expect(addGitgraphPaletteItem(source, 'checkout')).toContain('checkout "release/trunk"');
  });

  it('reads only the GitGraph main branch setting from frontmatter', () => {
    const configured = '---\nconfig:\n  gitGraph:\n    mainBranchName: "trunk"\n---\ngitGraph\n';
    const commented = '---\n# mainBranchName: trunk\ncustom:\n  mainBranchName: elsewhere\n---\ngitGraph\n';
    expect(addGitgraphPaletteItem(configured, 'checkout')).toContain('checkout trunk');
    expect(addGitgraphPaletteItem(commented, 'checkout')).toContain('checkout main');
  });

  it('rejects unsupported flow-style main branch YAML instead of assuming main', () => {
    const source = '---\nconfig: { gitGraph: { mainBranchName: trunk } }\n---\ngitGraph\n';
    expect(() => addGitgraphPaletteItem(source, 'checkout')).toThrow(AmbiguousSourceMutationError);
    const multiline = '---\nconfig:\n  gitGraph: {\n    mainBranchName: trunk\n  }\n---\ngitGraph\n';
    expect(() => addGitgraphPaletteItem(multiline, 'checkout')).toThrow(AmbiguousSourceMutationError);
  });

  it('does not read a same-named option from another init directive section', () => {
    const source = '%%{init: {"other": {"mainBranchName": "elsewhere"}}}%%\ngitGraph\n';
    expect(() => addGitgraphPaletteItem(source, 'checkout')).toThrow(AmbiguousSourceMutationError);
  });

  it('checks out the configured main branch when another branch is named main', () => {
    const source = '%%{init: {"gitGraph": {"mainBranchName": "trunk"}}}%%\ngitGraph\n    commit\n    branch main\n    commit\n';
    expect(addGitgraphPaletteItem(source, 'checkout')).toContain('checkout trunk');
  });

  it('quotes configured main branch names that contain spaces', () => {
    const source = '%%{init: {"gitGraph": {"mainBranchName": "release trunk"}}}%%\ngitGraph\n';
    expect(addGitgraphPaletteItem(source, 'checkout')).toContain('checkout "release trunk"');
  });

  it('decodes escaped quotes in a configured main branch before quoting checkout', async () => {
    const name = 'release "trunk"';
    const source = `%%{init: {"gitGraph": {"mainBranchName": ${JSON.stringify(name)}}}}%%\ngitGraph\n`;
    const after = addGitgraphPaletteItem(source, 'checkout');
    expect(after).toContain(`checkout ${JSON.stringify(name)}`);
    await mermaid.parse(after);
  });

  it('selects a different committed branch as the merge target', async () => {
    const source = 'gitGraph\n    commit id: "base"\n    branch feature\n    commit id: "work"\n';
    const after = addGitgraphPaletteItem(source, 'merge');
    expect(after).toContain('merge main');
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(after);
    const db = diagram.db as unknown as { getCommitsArray(): { id: string; parents: string[] }[] };
    expect(db.getCommitsArray().at(-1)?.parents).toEqual(['work', 'base']);
  });

  it('quotes branch names with spaces in generated merge references', async () => {
    const source = 'gitGraph\n    commit id: "base"\n    branch "release train"\n    commit id: "release"\n    checkout main\n    commit id: "main-work"\n';
    const after = addGitgraphPaletteItem(source, 'merge');
    expect(after).toContain('merge "release train"');
    await mermaid.parse(after);
  });

  it('decodes escaped quotes in source branch names before selecting a merge target', async () => {
    const name = 'release "train"';
    const source = `gitGraph\n    commit id: "base"\n    branch ${JSON.stringify(name)}\n    commit id: "release"\n    checkout main\n    commit id: "main-work"\n`;
    const after = addGitgraphPaletteItem(source, 'merge');
    expect(after).toContain(`merge ${JSON.stringify(name)}`);
    await mermaid.parse(after);
  });

  it('rejects merge when the graph has no two divergent committed branches', () => {
    expect(() => addGitgraphPaletteItem('gitGraph\n', 'merge')).toThrow(AmbiguousSourceMutationError);
    expect(() => addGitgraphPaletteItem('gitGraph\n    commit\n    branch feature\n', 'merge'))
      .toThrow(AmbiguousSourceMutationError);
  });

  it.each(['\r\n', '\n', '\r'])('preserves %j and a missing final newline', (ending) => {
    const source = `gitGraph${ending}\tcommit`;
    expect(addGitgraphPaletteItem(source, 'tagged')).toBe(`${source}${ending}\tcommit tag: "v1.0"`);
  });

  it('rejects a mismatched diagram and unknown palette item', () => {
    expect(() => addGitgraphPaletteItem('journey\n', 'commit')).toThrow(AmbiguousSourceMutationError);
    expect(() => addGitgraphPaletteItem('gitGraph\n', 'unknown' as GitgraphPaletteItemId)).toThrow(AmbiguousSourceMutationError);
  });
});
