import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';

/** Identifier of a pie chart palette item. */
export type PiePaletteItemId = 'title' | 'slice';

/** A pie chart palette item and its source snippet. */
export interface PiePaletteItem {
  /** Element or palette item identifier. */
  id: PiePaletteItemId;
  /** Displayed label. */
  label: string;
  /** Icon identifier for the palette item. */
  icon: string;
  /** Mermaid source snippet inserted by the palette item. */
  snippet: string;
}

/** A titled group of pie chart palette items. */
export interface PiePaletteGroup {
  /** Palette group heading or subgraph title. */
  title: string;
  /** Items in this palette group. */
  items: readonly PiePaletteItem[];
}

/** A parsed pie chart slice and its source offsets. */
export interface PieSlice {
  /** Displayed label. */
  label: string;
  /** Style or slice value. */
  value: number;
  /** Start offset of the label, when present. */
  labelStart: number;
  /** End offset of the label, when present. */
  labelEnd: number;
  /** Start offset of the numeric value token. */
  valueStart: number;
  /** End offset of the numeric value token. */
  valueEnd: number;
}

/** Palette items exported for pie diagrams. */
export const piePalette: readonly PiePaletteGroup[] = [
  { title: 'Structure', items: [
    { id: 'title', label: 'Title', icon: 't', snippet: 'title Pie title' },
  ] },
  { title: 'Slices', items: [
    { id: 'slice', label: 'Slice', icon: '◔', snippet: '"Label" : 25' },
  ] },
];

const itemById = new Map(piePalette.flatMap(({ items }) => items.map((item) => [item.id, item] as const)));
interface PieSource {
  slices: PieSlice[];
  hasTitle: boolean;
}

// Scan tokens rather than lines so metadata and multiline labels cannot become slices.
function scanPie(source: string): PieSource {
  const slices: PieSlice[] = [];
  let offset = source.charCodeAt(0) === 0xfeff ? 1 : 0;
  let hasTitle = false;
  const fail = (): never => { throw new AmbiguousSourceMutationError('The Pie source contains an unsupported or incomplete statement.'); };
  const skipSpace = (): void => { while (/\s/.test(source[offset] ?? '') && offset < source.length) offset++; };
  const skipLine = (): void => { while (offset < source.length && !/[\r\n]/.test(source[offset]!)) offset++; };
  skipSpace();
  if (source.slice(offset).startsWith('---')) {
    const metadata = /^---[^\S\r\n]*(?:\r\n|\n|\r)[\s\S]*?(?:^---|^\.\.\.)[^\S\r\n]*(?=\r|\n|$)/m.exec(source.slice(offset));
    if (!metadata) fail();
    offset += metadata![0].length;
  }
  let headerSeen = false;
  while (offset < source.length) {
    skipSpace();
    if (offset === source.length) break;
    if (source.startsWith('%%{', offset)) {
      const end = source.indexOf('}%%', offset + 3);
      if (end < 0) fail();
      offset = end + 3;
      continue;
    }
    if (source[offset] === '%') { skipLine(); continue; }
    if (!headerSeen) {
      const header = /^pie\b/i.exec(source.slice(offset));
      if (!header) throw new AmbiguousSourceMutationError('A Pie edit requires a pie source.');
      offset += header[0].length;
      headerSeen = true;
      const showData = /^\s+showData\b/i.exec(source.slice(offset));
      if (showData) offset += showData[0].length;
      continue;
    }
    if (/^title\b/i.test(source.slice(offset))) { hasTitle = true; skipLine(); continue; }
    if (/^accTitle\s*:/i.test(source.slice(offset))) { skipLine(); continue; }
    const description = /^accDescr\s*([:{])/i.exec(source.slice(offset));
    if (description) {
      if (description[1] === ':') skipLine();
      else {
        const end = source.indexOf('}', offset + description[0].length);
        if (end < 0) fail();
        offset = end + 1;
      }
      continue;
    }
    const quote = source[offset];
    if (quote !== '"' && quote !== "'") fail();
    const labelStart = offset++;
    while (offset < source.length && source[offset] !== quote) {
      if (source[offset] === '\\') offset++;
      offset++;
    }
    if (offset >= source.length) fail();
    const labelEnd = ++offset;
    skipSpace();
    if (source[offset++] !== ':') fail();
    skipSpace();
    const valueToken = /^(?:[0-9]+\.[0-9]+(?!\.)|(?:0|[1-9][0-9]*)(?!\.))/.exec(source.slice(offset));
    if (!valueToken) fail();
    const valueStart = offset;
    offset += valueToken![0].length;
    const value = Number(valueToken![0]);
    if (!Number.isFinite(value)) fail();
    slices.push({ label: decodeLabel(source.slice(labelStart, labelEnd)), value,
      labelStart, labelEnd, valueStart, valueEnd: offset });
  }
  if (!headerSeen) throw new AmbiguousSourceMutationError('A Pie edit requires a pie source.');
  return { slices, hasTitle };
}

function indentation(source: string): string {
  const first = scanPie(source).slices[0];
  if (!first) return '    ';
  const lineStart = Math.max(source.lastIndexOf('\n', first.labelStart - 1), source.lastIndexOf('\r', first.labelStart - 1)) + 1;
  const prefix = source.slice(lineStart, first.labelStart);
  return /^[\t ]*$/.test(prefix) ? prefix : '    ';
}

function decodeLabel(token: string): string {
  const escapes: Record<string, string> = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', '0': '\0' };
  return token.slice(1, -1).replace(/\\([\s\S])/g, (_match, character: string) => escapes[character] ?? character);
}

function quoteLabel(label: string): string {
  return `"${label.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t')}"`;
}

function formatValue(value: number): string {
  const valueString = String(value);
  if (!/[eE]/.test(valueString)) return valueString;
  const [coefficient, exponentText] = valueString.toLowerCase().split('e');
  const exponent = Number(exponentText);
  const [whole, fraction = ''] = coefficient!.split('.');
  const digits = `${whole}${fraction}`;
  const decimalIndex = whole!.length + exponent;
  if (decimalIndex <= 0) return `0.${'0'.repeat(-decimalIndex)}${digits}`;
  if (decimalIndex >= digits.length) return `${digits}${'0'.repeat(decimalIndex - digits.length)}`;
  return `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

/**
 * Lists slices parsed from a pie chart source.
 * @param source - Mermaid source to inspect or update.
 */
export function listPieSlices(source: string): PieSlice[] {
  return scanPie(source).slices;
}

function appendLine(source: string, line: string): string {
  return appendSourceLines(source, [`${indentation(source)}${line}`], 'pie');
}

/**
 * Adds a pie chart palette item to the source.
 * @param source - Mermaid source to inspect or update.
 * @param itemId - Identifier of the palette item to add.
 */
export function addPiePaletteItem(source: string, itemId: PiePaletteItemId): string {
  const parsed = scanPie(source);
  const item = itemById.get(itemId);
  if (!item) throw new AmbiguousSourceMutationError('The Pie palette item is not supported.');
  if (itemId === 'title') {
    if (parsed.hasTitle) throw new AmbiguousSourceMutationError('A Pie title already exists; edit it in source instead of adding a duplicate.');
    return appendLine(source, item.snippet);
  }
  const used = new Set(parsed.slices.map(({ label }) => label));
  let label = 'Label';
  let index = 2;
  while (used.has(label)) label = `Label ${index++}`;
  return appendLine(source, `${quoteLabel(label)} : 25`);
}

/**
 * Updates a pie chart slice value.
 * @param source - Mermaid source to inspect or update.
 * @param label - Displayed label.
 * @param value - Value to assign.
 */
export function setPieSliceValue(source: string, label: string, value: number): string {
  const slices = listPieSlices(source).filter((slice) => slice.label === label);
  if (slices.length !== 1) throw new AmbiguousSourceMutationError('The Pie slice is missing or ambiguous.');
  if (!Number.isFinite(value) || value < 0) throw new AmbiguousSourceMutationError('A Pie slice value must be a finite non-negative number.');
  const slice = slices[0]!;
  return `${source.slice(0, slice.valueStart)}${formatValue(value)}${source.slice(slice.valueEnd)}`;
}

/**
 * Renames a pie chart slice.
 * @param source - Mermaid source to inspect or update.
 * @param currentLabel - Current slice label.
 * @param nextLabel - Replacement slice label.
 */
export function setPieSliceLabel(source: string, currentLabel: string, nextLabel: string): string {
  const allSlices = listPieSlices(source);
  const slices = allSlices.filter((slice) => slice.label === currentLabel);
  if (slices.length !== 1) throw new AmbiguousSourceMutationError('The Pie slice is missing or ambiguous.');
  if (nextLabel === currentLabel) return source;
  if (!nextLabel.trim() || allSlices.some((slice) => slice.label === nextLabel)) {
    throw new AmbiguousSourceMutationError('Pie slice labels must remain unique for safe editing.');
  }
  const slice = slices[0]!;
  return `${source.slice(0, slice.labelStart)}${quoteLabel(nextLabel)}${source.slice(slice.labelEnd)}`;
}
