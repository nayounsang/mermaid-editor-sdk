import { AmbiguousSourceMutationError } from './source-document';

export interface PaletteItem<Id extends string> {
  id: Id;
  label: string;
  icon: string;
  snippet: string;
}

export interface PaletteGroup<Id extends string> {
  title: string;
  items: readonly PaletteItem<Id>[];
}

export interface DiagramLine {
  text: string;
  start: number;
  end: number;
}

/** Return diagram statements without interpreting metadata as diagram content. */
export function diagramLines(source: string, header: RegExp): DiagramLine[] {
  const result: DiagramLine[] = [];
  let block: 'frontmatter' | 'directive' | 'description' | undefined;
  let firstContent = true;
  const lines = source.matchAll(/[^\r\n]*(?:\r\n|\n|\r|$)/g);
  for (const match of lines) {
    if (!match[0]) continue;
    const text = match[0].replace(/(?:\r\n|\n|\r)$/, '');
    const trimmed = text.trim();
    if (block) {
      if (block === 'frontmatter' && /^(?:---|\.\.\.)$/.test(trimmed)
        || block === 'directive' && trimmed.includes('}%%')
        || block === 'description' && trimmed.includes('}')) block = undefined;
      continue;
    }
    if (!trimmed) continue;
    if (firstContent && trimmed === '---') { block = 'frontmatter'; firstContent = false; continue; }
    firstContent = false;
    if (trimmed.startsWith('%%{')) {
      if (!trimmed.includes('}%%')) block = 'directive';
      continue;
    }
    if (trimmed.startsWith('%')) continue;
    if (/^accDescr\s*\{/.test(trimmed)) {
      if (!trimmed.includes('}')) block = 'description';
      continue;
    }
    if (/^acc(?:Title|Descr)\s*:/.test(trimmed)) continue;
    result.push({ text, start: match.index, end: match.index + text.length });
  }
  if (block) throw new AmbiguousSourceMutationError('An unfinished metadata block prevents safe palette insertion.');
  if (!result[0] || !header.test(result[0].text.trim())) {
    throw new AmbiguousSourceMutationError('The palette does not match the source diagram type.');
  }
  return result;
}

export function appendDiagramLine(source: string, snippet: string, indent = '    '): string {
  const ending = /\r\n|\n|\r/.exec(source)?.[0] ?? '\n';
  const terminated = /[\r\n]$/.test(source);
  return `${source}${terminated ? '' : ending}${indent}${snippet}${terminated ? ending : ''}`;
}
