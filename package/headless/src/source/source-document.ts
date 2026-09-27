import type { DiagramType } from '../diagrams/capability';
import { diffChars } from 'diff';

export type SourceRegionKind = 'blank' | 'comment' | 'metadata' | 'statement' | 'opaque';

export interface SourceRegion {
  kind: SourceRegionKind;
  start: number;
  end: number;
  fullEnd: number;
  text: string;
  rawText: string;
  editable: boolean;
}

export class AmbiguousSourceMutationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmbiguousSourceMutationError';
  }
}

/** Append diagram statements before trailing comments and whitespace. */
export function appendSourceLines(source: string, additions: readonly string[], diagramType: DiagramType): string {
  if (!additions.length) return source;
  const regions = new SourceDocument(source, diagramType).regions;
  const headerPatterns: Partial<Record<DiagramType, RegExp>> = {
    flowchart: /^\s*(?:flowchart|graph)\b/i,
    sequence: /^\s*sequenceDiagram\b/i,
    class: /^\s*classDiagram(?:-v2)?\b/i,
    state: /^\s*stateDiagram(?:-v2)?\b/i,
    er: /^\s*erDiagram\b/i,
    gantt: /^\s*gantt\b/i,
    pie: /^\s*pie\b/i,
    journey: /^\s*journey\b/i,
    mindmap: /^\s*mindmap\b/i,
    gitgraph: /^\s*gitGraph\b/i,
    timeline: /^\s*timeline\b/i,
    quadrant: /^\s*quadrantChart\b/i,
  };
  const headerPattern = headerPatterns[diagramType];
  const statements = regions.map((region, index) => ({ region, index }))
    .filter(({ region }) => region.kind === 'statement' && !headerPattern?.test(region.text));
  let insertion: number;
  if (statements.length > 0) {
    const lastStatementIndex = statements.at(-1)!.index;
    insertion = regions[lastStatementIndex + 1]?.start ?? source.length;
  } else {
    const headerIndex = regions.findIndex(({ kind, text }) => kind === 'statement' && headerPattern?.test(text));
    let preludeEnd = headerIndex >= 0 ? regions[headerIndex]!.fullEnd : 0;
    for (let index = headerIndex + 1; index < regions.length; index++) {
      const region = regions[index]!;
      if (region.kind === 'statement' || region.kind === 'metadata') break;
      preludeEnd = region.fullEnd;
    }
    insertion = Math.max(preludeEnd, source.length === 0 ? 0 : regions.at(-1)?.fullEnd ?? 0);
  }
  const before = source.slice(0, insertion);
  const after = source.slice(insertion);
  const ending = /\r\n|\n|\r/.exec(source)?.[0] ?? '\n';
  const separator = before && !/(?:\r\n|\n|\r)$/.test(before) ? ending : '';
  const needsEndingAfter = after.length > 0 || /(?:\r\n|\n|\r)$/.test(source);
  return `${before}${separator}${additions.join(ending)}${needsEndingAfter ? ending : ''}${after}`;
}

const simpleNodeDeclaration = /^\s*[\w.-]+\s*(?:\[[^\]\r\n]*\]|\([^)\r\n]*\)|\{[^}\r\n]*\})\s*;?\s*$/;

function getFlowNodeId(statement: string): string | undefined {
  const match = /^\s*([\w.-]+)\s*(?:\[[^\]\r\n]*\]|\([^)\r\n]*\)|\{[^}\r\n]*\})\s*;?\s*$/.exec(statement);
  return match?.[1];
}

function isOpaqueLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('%%{') || trimmed.startsWith('%%') || trimmed.startsWith('%');
}

export class SourceDocument {
  readonly source: string;
  readonly diagramType: DiagramType;
  readonly regions: readonly SourceRegion[];

  constructor(source: string, diagramType: DiagramType) {
    this.source = source;
    this.diagramType = diagramType;
    this.regions = Object.freeze(
      scanRegions(source, diagramType).map((region) => Object.freeze(region)),
    );
  }

  replaceStatement(start: number, end: number, replacement: string): string {
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > this.source.length) {
      throw new RangeError('Mutation span is outside the source document.');
    }
    if (this.source.slice(start, end) === replacement) return this.source;
    const region = this.regions.find((candidate) => candidate.start === start && candidate.end === end);
    if (!region || !region.editable || region.kind !== 'statement') {
      throw new AmbiguousSourceMutationError('The mutation does not target one safe statement span.');
    }
    if (/[\r\n]/.test(replacement) || !simpleNodeDeclaration.test(replacement)) {
      throw new AmbiguousSourceMutationError('The replacement is not one supported flowchart node statement.');
    }
    if (getFlowNodeId(region.text) !== getFlowNodeId(replacement)) {
      throw new AmbiguousSourceMutationError('Node identity changes require reference-aware mutation support.');
    }
    return this.serializeMutation(this.source.slice(0, start) + replacement + this.source.slice(end));
  }

  findUniqueEditableStatement(statement: string): SourceRegion {
    const matches = this.regions.filter((region) => region.editable && region.text === statement);
    if (matches.length !== 1) {
      throw new AmbiguousSourceMutationError('The statement is missing or occurs more than once.');
    }
    return matches[0]!;
  }

  serializeMutation(candidate: string): string {
    if (candidate === this.source) return this.source;
    const changes = diffChars(this.source, candidate);
    let sourceOffset = 0;
    let output = '';

    for (const change of changes) {
      if (change.added) {
        const protectedInsertion = this.regions.some((region) => region.kind !== 'statement'
          && region.start < sourceOffset && sourceOffset < region.fullEnd);
        if (protectedInsertion) throw new AmbiguousSourceMutationError('The mutation inserts text inside a protected source region.');
        output += change.value;
        continue;
      }
      if (change.removed) {
        const spanEnd = sourceOffset + change.value.length;
        const overlapsProtectedRegion = this.regions.some((region) => region.kind !== 'statement'
          && sourceOffset < region.fullEnd && spanEnd > region.start);
        if (overlapsProtectedRegion) throw new AmbiguousSourceMutationError('The mutation changes a protected source region.');
        sourceOffset = spanEnd;
        continue;
      }
      output += this.source.slice(sourceOffset, sourceOffset + change.value.length);
      sourceOffset += change.value.length;
    }

    if (sourceOffset !== this.source.length || output !== candidate) {
      throw new AmbiguousSourceMutationError('The source diff could not be serialized without losing source spans.');
    }
    const currentProtectedRegions = this.regions
      .filter((region) => region.kind !== 'statement')
      .map((region) => `${region.kind}\u0000${region.rawText}`);
    const nextProtectedRegions = scanRegions(candidate, this.diagramType)
      .filter((region) => region.kind !== 'statement')
      .map((region) => `${region.kind}\u0000${region.rawText}`);
    let nextRegionIndex = 0;
    for (const protectedRegion of currentProtectedRegions) {
      while (nextRegionIndex < nextProtectedRegions.length && nextProtectedRegions[nextRegionIndex] !== protectedRegion) nextRegionIndex++;
      if (nextRegionIndex >= nextProtectedRegions.length) {
        throw new AmbiguousSourceMutationError('The mutation does not preserve comments, metadata, whitespace, or opaque source regions.');
      }
      nextRegionIndex++;
    }
    return output;
  }
}

function scanRegions(
  source: string,
  diagramType: DiagramType,
): SourceRegion[] {
  const regions: SourceRegion[] = [];
  const hasBom = source.charCodeAt(0) === 0xfeff;
  const lines = source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? [];
  let offset = 0;
  let firstContent = true;
  let frontmatter = false;
  let frontmatterAllowed = true;

  for (const rawLine of lines) {
    if (rawLine.length === 0) continue;
    const endingLength = rawLine.endsWith('\r\n') ? 2 : /[\r\n]$/.test(rawLine) ? 1 : 0;
    const line = rawLine.slice(0, rawLine.length - endingLength);
    const start = offset;
    const end = offset + line.length;
    const visibleLine = hasBom && start === 0 ? line.slice(1) : line;
    const trimmed = visibleLine.trim();
    let kind: SourceRegionKind;
    let editable = false;

    if (firstContent && trimmed === '---' && frontmatterAllowed) {
      frontmatter = true;
      kind = 'metadata';
      frontmatterAllowed = false;
    } else if (frontmatter) {
      kind = 'metadata';
      if (trimmed === '---' || trimmed === '...') frontmatter = false;
    } else if (!trimmed) {
      kind = 'blank';
    } else if (visibleLine.trimStart().startsWith('%%') && !visibleLine.trimStart().startsWith('%%{')) {
      kind = 'comment';
    } else if (isOpaqueLine(visibleLine)) {
      kind = 'opaque';
    } else {
      kind = 'statement';
      editable = diagramType === 'flowchart' && simpleNodeDeclaration.test(visibleLine);
      frontmatterAllowed = false;
    }

    regions.push({ kind, start, end, fullEnd: offset + rawLine.length, text: line, rawText: rawLine, editable });
    if (trimmed) firstContent = false;
    offset += rawLine.length;
  }
  return regions;
}
