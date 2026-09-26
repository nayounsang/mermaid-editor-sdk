import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';
import type { DiagramType } from '../diagrams/capability';

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
export function diagramLines(source: string, header: RegExp, options: { accessibilityMetadata?: boolean; lineComment?: RegExp } = {}): DiagramLine[] {
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
    if ((options.lineComment ?? /^(?:%|#)/).test(trimmed)) continue;
    if (options.accessibilityMetadata !== false && /^accDescr\s*\{/.test(trimmed)) {
      if (!trimmed.includes('}')) block = 'description';
      continue;
    }
    if (options.accessibilityMetadata !== false && /^acc(?:Title|Descr)\s*:/.test(trimmed)) continue;
    result.push({ text, start: match.index, end: match.index + text.length });
  }
  if (block) throw new AmbiguousSourceMutationError('An unfinished metadata block prevents safe palette insertion.');
  if (!result[0] || !header.test(result[0].text.trim())) {
    throw new AmbiguousSourceMutationError('The palette does not match the source diagram type.');
  }
  return result;
}

export function appendDiagramLine(source: string, snippet: string, indent: string, diagramType: DiagramType): string {
  return appendSourceLines(source, snippet.split('\n').map((line) => `${indent}${line}`), diagramType);
}
