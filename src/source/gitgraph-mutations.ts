import type { PaletteGroup } from './palette-source';
import { AmbiguousSourceMutationError } from './source-document';
import { appendDiagramLine, diagramLines } from './palette-source';

export type GitgraphPaletteItemId = 'commit' | 'commit-id' | 'tagged' | 'branch' | 'checkout' | 'merge';

/** Baseline source snippets: branch names and IDs remain editable in source. */
export const gitgraphPalette: readonly PaletteGroup<GitgraphPaletteItemId>[] = [
  { title: 'Commits', items: [
    { id: 'commit', label: 'Commit', icon: '●', snippet: 'commit' },
    { id: 'commit-id', label: 'Commit with id', icon: '●id', snippet: 'commit id: "msg"' },
    { id: 'tagged', label: 'Tagged commit', icon: 'tag', snippet: 'commit tag: "v1.0"' },
  ] },
  { title: 'Branches', items: [
    { id: 'branch', label: 'Branch', icon: '├', snippet: 'branch feature' },
    { id: 'checkout', label: 'Checkout', icon: '⇄', snippet: 'checkout main' },
    { id: 'merge', label: 'Merge', icon: '⇆', snippet: 'merge feature' },
  ] },
];

const items = new Map(gitgraphPalette.flatMap(({ items }) => items.map((item) => [item.id, item])));

interface GraphState {
  mainBranch: string;
  branches: string[];
  heads: Map<string, string | undefined>;
  currentBranch: string;
  commitIds: Set<string>;
  ambiguous: boolean;
}

function readDirectiveMainBranchNames(directive: string): string[] {
  const values: string[] = [];
  const graphObjects = [...directive.matchAll(/["']?gitGraph["']?\s*:\s*\{([^{}]*)\}/gs)];
  for (const graphObject of graphObjects) {
    const key = /["']?mainBranchName["']?\s*:\s*("(?:\\.|[^"\\])*"|'(?:''|[^'])*'|[\w./-]+)/.exec(graphObject[1]!);
    if (key) values.push(parseBranchScalar(key[1]!));
  }
  const keyCount = [...directive.matchAll(/["']?mainBranchName["']?\s*:/g)].length;
  if (keyCount !== values.length) {
    throw new AmbiguousSourceMutationError('The Gitgraph init directive has an ambiguous main branch setting.');
  }
  return values;
}

function parseBranchScalar(value: string): string {
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === 'string' && parsed.length > 0) return parsed;
    } catch { /* Unsupported escapes are rejected below. */ }
  } else if (value.startsWith("'")) {
    if (value.endsWith("'") && value.length >= 2) return value.slice(1, -1).replace(/''/g, "'");
  } else if (/^[\w./-]+$/.test(value)) return value;
  throw new AmbiguousSourceMutationError('The configured Gitgraph main branch name cannot be read safely.');
}

function sourceScalar(source: string, key: string): string | undefined {
  let quote: 'single' | 'double' | undefined;
  for (let index = 0; index < source.length; index++) {
    const character = source[index]!;
    if (quote === 'double' && character === '\\') { index++; continue; }
    if (quote === 'single' && character === "'" && source[index + 1] === "'") { index++; continue; }
    if (character === '"' && quote !== 'single') { quote = quote === 'double' ? undefined : 'double'; continue; }
    if (character === "'" && quote !== 'double') { quote = quote === 'single' ? undefined : 'single'; continue; }
    if (quote || source.slice(index, index + key.length).toLowerCase() !== key.toLowerCase()) continue;
    const previous = source[index - 1];
    const next = source[index + key.length];
    if (previous && /[\w$]/.test(previous) || next && /[\w$]/.test(next)) continue;
    const field = new RegExp(`^\\s*:\\s*("(?:\\\\.|[^"\\\\])*"|'(?:''|[^'])*'|[^\\s,]+)`, 'i')
      .exec(source.slice(index + key.length));
    if (field) return parseBranchScalar(field[1]!);
  }
  return undefined;
}

function configuredMainBranch(source: string): string {
  const lines = source.split(/\r\n|\n|\r/);
  let metadata: 'frontmatter' | 'directive' | undefined;
  let firstContent = true;
  const values: string[] = [];
  const yamlPath: { indent: number; key: string }[] = [];
  let unsupportedYamlSetting = false;
  let yamlFlowDepth = 0;
  let directiveText = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (metadata) {
      if (metadata === 'frontmatter') {
        if (/^(?:---|\.\.\.)$/.test(trimmed)) { metadata = undefined; continue; }
        const yamlLine = stripYamlComment(line);
        const entry = /^([\t ]*)(["']?)([\w.-]+)\2\s*:\s*(.*)$/.exec(yamlLine);
        if (!entry) {
          if (/(?:^|[{,]\s*)["']?mainBranchName["']?\s*:/.test(yamlLine)) unsupportedYamlSetting = true;
          yamlFlowDepth = Math.max(0, yamlFlowDepth + yamlFlowDelta(yamlLine));
          continue;
        }
        const inFlowMapping = yamlFlowDepth > 0;
        const indent = entry[1]!.length;
        const key = entry[3]!;
        while (yamlPath.at(-1) && yamlPath.at(-1)!.indent >= indent) yamlPath.pop();
        if (key === 'mainBranchName' && yamlPath.slice(-2).map(({ key: parent }) => parent).join('.') === 'config.gitGraph') {
          const value = /^("(?:\\.|[^"\\])*"|'(?:''|[^'])*'|[\w./-]+)\s*$/.exec(entry[4]!);
          if (!value) throw new AmbiguousSourceMutationError('The configured Gitgraph main branch name cannot be read safely.');
          values.push(parseBranchScalar(value[1]!));
        } else if (key === 'mainBranchName' && inFlowMapping) unsupportedYamlSetting = true;
        else if (!entry[4]!.trim()) yamlPath.push({ indent, key });
        else if (/(?:^|[{,]\s*)["']?mainBranchName["']?\s*:/.test(entry[4]!)) unsupportedYamlSetting = true;
        yamlFlowDepth = Math.max(0, yamlFlowDepth + yamlFlowDelta(yamlLine));
      } else {
        directiveText += `${line}\n`;
        if (trimmed.includes('}%%')) {
          values.push(...readDirectiveMainBranchNames(directiveText));
          directiveText = '';
          metadata = undefined;
        }
      }
      continue;
    }
    if (firstContent && trimmed === '---') { metadata = 'frontmatter'; firstContent = false; continue; }
    firstContent = false;
    if (trimmed.startsWith('%%{')) {
      directiveText = `${line}\n`;
      if (trimmed.includes('}%%')) {
        values.push(...readDirectiveMainBranchNames(directiveText));
        directiveText = '';
      } else metadata = 'directive';
    }
  }
  if (unsupportedYamlSetting) throw new AmbiguousSourceMutationError('The Gitgraph main branch setting uses an unsupported YAML form.');
  if (new Set(values).size > 1) throw new AmbiguousSourceMutationError('Conflicting Gitgraph main branch settings prevent safe insertion.');
  return values[0] ?? 'main';
}

function yamlFlowDelta(line: string): number {
  let depth = 0;
  let quote: 'single' | 'double' | undefined;
  for (let index = 0; index < line.length; index++) {
    const character = line[index]!;
    if (quote === 'double' && character === '\\') { index++; continue; }
    if (character === '"' && quote !== 'single') quote = quote === 'double' ? undefined : 'double';
    else if (character === "'" && quote !== 'double') quote = quote === 'single' ? undefined : 'single';
    else if (!quote && character === '{') depth++;
    else if (!quote && character === '}') depth--;
  }
  return depth;
}

function stripYamlComment(line: string): string {
  let quote: 'single' | 'double' | undefined;
  for (let index = 0; index < line.length; index++) {
    const character = line[index]!;
    if (quote === 'double' && character === '\\') { index++; continue; }
    if (character === '"' && quote !== 'single') quote = quote === 'double' ? undefined : 'double';
    else if (character === "'" && quote !== 'double') quote = quote === 'single' ? undefined : 'single';
    else if (character === '#' && !quote && (index === 0 || /\s/.test(line[index - 1]!))) return line.slice(0, index);
  }
  return line;
}

function branchReference(name: string): string {
  return /^[\w.-]+$/.test(name) ? name : JSON.stringify(name);
}

function readGraphState(source: string, lines: ReturnType<typeof diagramLines>): GraphState {
  const main = configuredMainBranch(source);
  const state: GraphState = {
    mainBranch: main, branches: [main], heads: new Map([[main, undefined]]), currentBranch: main, commitIds: new Set(), ambiguous: false,
  };
  let headIndex = 0;
  for (const { text } of lines.slice(1)) {
    const statement = text.trim();
    const branch = /^branch\s+("(?:\\.|[^"\\])*"|'(?:''|[^'])*'|[^\s]+)(?:\s|$)/i.exec(statement);
    if (branch) {
      const name = parseBranchScalar(branch[1]!);
      const currentHead = state.heads.get(state.currentBranch);
      if (!name || state.heads.has(name) || !state.heads.has(state.currentBranch)) { state.ambiguous = true; continue; }
      state.branches.push(name);
      state.heads.set(name, currentHead);
      state.currentBranch = name;
      continue;
    }
    const checkout = /^checkout\s+("(?:\\.|[^"\\])*"|'(?:''|[^'])*'|[^\s]+)(?:\s|$)/i.exec(statement);
    if (checkout) {
      const name = parseBranchScalar(checkout[1]!);
      if (!name || !state.heads.has(name)) { state.ambiguous = true; continue; }
      state.currentBranch = name;
      continue;
    }
    if (/^commit\b/i.test(statement)) {
      const id = sourceScalar(statement, 'id');
      if (id && state.commitIds.has(id)) state.ambiguous = true;
      if (id) state.commitIds.add(id);
      if (!state.heads.has(state.currentBranch)) state.ambiguous = true;
      state.heads.set(state.currentBranch, `commit-${headIndex++}`);
      continue;
    }
    const merge = /^merge\s+("(?:\\.|[^"\\])*"|'(?:''|[^'])*'|[^\s]+)(?:\s|$)/i.exec(statement);
    if (merge) {
      const target = parseBranchScalar(merge[1]!);
      const currentHead = state.heads.get(state.currentBranch);
      const targetHead = target ? state.heads.get(target) : undefined;
      if (!target || !currentHead || !targetHead || target === state.currentBranch || currentHead === targetHead) {
        state.ambiguous = true;
        continue;
      }
      state.heads.set(state.currentBranch, `merge-${headIndex++}`);
      const id = sourceScalar(statement, 'id');
      if (id && state.commitIds.has(id)) state.ambiguous = true;
      if (id) state.commitIds.add(id);
      continue;
    }
    if (/^cherry-pick\b/i.test(statement)) {
      state.ambiguous = true;
      continue;
    }
    state.ambiguous = true;
  }
  return state;
}

export function addGitgraphPaletteItem(source: string, id: GitgraphPaletteItemId): string {
  const lines = diagramLines(source, /^gitGraph\b/i, { lineComment: /^%%/ });
  const item = items.get(id);
  if (!item) throw new AmbiguousSourceMutationError('The Gitgraph palette item is not supported.');
  const indent = /^[\t ]*/.exec(lines[1]?.text ?? '    ')![0];
  const state = readGraphState(source, lines);
  let snippet = item.snippet;
  if (id === 'commit-id') {
    if (state.ambiguous) throw new AmbiguousSourceMutationError('Existing Gitgraph commands prevent safe commit ID generation.');
    let name = 'msg';
    let suffix = 2;
    while (state.commitIds.has(name)) name = `msg${suffix++}`;
    snippet = `commit id: "${name}"`;
  } else if (id === 'branch') {
    if (state.ambiguous) throw new AmbiguousSourceMutationError('Existing Gitgraph commands prevent safe branch name generation.');
    let name = 'feature';
    let suffix = 2;
    while (state.heads.has(name)) name = `feature${suffix++}`;
    snippet = `branch ${name}`;
  } else if (id === 'checkout') {
    if (state.mainBranch !== 'main' || !state.heads.has('main')) {
      snippet = `checkout ${branchReference(state.mainBranch)}`;
    }
  } else if (id === 'merge') {
    if (state.ambiguous) throw new AmbiguousSourceMutationError('Existing Gitgraph commands prevent safe merge target selection.');
    const currentHead = state.heads.get(state.currentBranch);
    const candidates = state.branches.filter((name) => name !== state.currentBranch
      && state.heads.get(name) && state.heads.get(name) !== currentHead);
    const target = candidates.includes('feature') ? 'feature' : candidates[0];
    if (!target || !currentHead) {
      throw new AmbiguousSourceMutationError('Add commits to two different branches before inserting a merge.');
    }
    snippet = `merge ${branchReference(target)}`;
  }
  return appendDiagramLine(source, snippet, indent, 'gitgraph');
}
