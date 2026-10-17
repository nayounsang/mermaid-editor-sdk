import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';
import type { DiagramType } from '../diagrams/capability';

/** A palette entry that can be inserted into a diagram. */
export interface PaletteItem<Id extends string> {
  /** Element or palette item identifier. */
  id: Id;
  /** Displayed label. */
  label: string;
  /** Icon identifier for the palette item. */
  icon: string;
  /** Mermaid source snippet inserted by the palette item. */
  snippet: string;
}

/** A titled group of palette entries. */
export interface PaletteGroup<Id extends string> {
  /** Palette group heading or subgraph title. */
  title: string;
  /** Items in this palette group. */
  items: readonly PaletteItem<Id>[];
}

/** A diagram source line and its source offsets. */
export interface DiagramLine {
  /** Line content without its line ending. */
  text: string;
  /** Start offset in the source. */
  start: number;
  /** End offset in the source. */
  end: number;
}

interface DiagramLinesOptions {
  /** Whether accessibility metadata blocks are skipped. */
  accessibilityMetadata?: boolean;
  /** Pattern that identifies line comments to skip. */
  lineComment?: RegExp;
}

/** Returns diagram statements without interpreting metadata as diagram content.
 * @param source - Diagram source to inspect.
 * @param header - Pattern that identifies the expected diagram header.
 * @param options - Options controlling accessibility metadata and line comments.
 */
export function diagramLines(source: string, header: RegExp, options: DiagramLinesOptions = {}): DiagramLine[] {
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

/**
 * Appends a snippet to the source using the requested indentation.
 * @param source - Mermaid source to inspect or update.
 * @param snippet - Mermaid source snippet to append.
 * @param indent - Indentation prefix for each inserted line.
 * @param diagramType - Diagram type used to validate the source.
 */
export function appendDiagramLine(source: string, snippet: string, indent: string, diagramType: DiagramType): string {
  return appendSourceLines(source, snippet.split('\n').map((line) => `${indent}${line}`), diagramType);
}
