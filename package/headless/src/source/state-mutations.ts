import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';

export interface StateTransition {
  source: string;
  target: string;
  label: string;
  occurrence: number;
  start: number;
  end: number;
  sourceStart: number;
  sourceEnd: number;
  targetStart: number;
  targetEnd: number;
  labelSeparatorStart?: number;
  labelStart?: number;
  labelEnd?: number;
}

interface SourceLine { text: string; start: number; end: number; fullEnd: number; }
interface TokenSpan { id: string; start: number; end: number; }

const ID = '[^:\\r\\n\\s;{}-]+?';
const transitionPattern = new RegExp(`^([\\t ]*)(\\[\\*\\]|${ID})[\\t ]*(-->|--)[\\t ]*(\\[\\*\\]|${ID})(?:[\\t ]*:[\\t ]*(.*))?[\\t ]*;?[\\t ]*$`);
const aliasPattern = new RegExp(`^([\\t ]*state[\\t ]+(?:"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')[\\t ]+as[\\t ]+)(${ID})(?:[\\t ]*;)?[\\t ]*$`, 'i');
const stateDeclarationPattern = new RegExp(`^([\\t ]*state[\\t ]+)(${ID})(?=[\\t ]|$)(.*)$`, 'i');
const compositePattern = new RegExp(`^([\\t ]*)(?:state[\\t ]+)?(${ID})([\\t ]*\\{)[\\t ]*$`, 'i');
const stylePattern = new RegExp(`^([\\t ]*style[\\t ]+)(${ID})(?:[\\t ]+(.*))?$`, 'i');

function linesOf(source: string): SourceLine[] {
  const lines: SourceLine[] = [];
  const pattern = /[^\r\n]*(?:\r\n|\n|\r|$)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    if (!match[0]) break;
    const ending = /(?:\r\n|\n|\r)$/.exec(match[0])?.[0] ?? '';
    lines.push({ text: match[0].slice(0, -ending.length || undefined), start: match.index,
      end: match.index + match[0].length - ending.length, fullEnd: match.index + match[0].length });
  }
  return lines;
}

function bodyLines(source: string): SourceLine[] {
  const lines = linesOf(source);
  let frontmatter = false;
  let frontmatterSeen = false;
  return lines.filter((line, index) => {
    const trimmed = line.text.trim().replace(/^\uFEFF/, '');
    if (index === 0 && trimmed === '---' && !frontmatterSeen) {
      frontmatter = true;
      frontmatterSeen = true;
      return false;
    }
    if (frontmatter) {
      if (trimmed === '---' || trimmed === '...') frontmatter = false;
      return false;
    }
    return !trimmed.startsWith('%%') && !trimmed.startsWith('%');
  });
}

function linesOutsideNotes(source: string): SourceLine[] {
  const result: SourceLine[] = [];
  let inNote = false;
  for (const line of bodyLines(source)) {
    const trimmed = line.text.trim();
    if (inNote) {
      if (/^end\s+note\s*;?$/i.test(trimmed)) inNote = false;
      continue;
    }
    if (/^note\b/i.test(trimmed)) {
      inNote = !/^note\b.*\bend\s+note\s*;?$/i.test(trimmed);
      continue;
    }
    result.push(line);
  }
  if (inNote) throw new AmbiguousSourceMutationError('An unterminated note block prevents safe state mutation.');
  return result;
}

function diagramBody(source: string): string {
  const header = bodyLines(source).find((line) => line.text.trim().replace(/^\uFEFF/, ''));
  if (!header || !/^stateDiagram(?:-v2)?\b/i.test(header.text.trim().replace(/^\uFEFF/, ''))) {
    throw new AmbiguousSourceMutationError('A state mutation requires a stateDiagram source.');
  }
  return source;
}

function transitions(source: string): StateTransition[] {
  const counts = new Map<string, number>();
  const result: StateTransition[] = [];
  for (const line of linesOutsideNotes(source)) {
    const match = transitionPattern.exec(line.text);
    if (!match) continue;
    const from = match[2]!;
    const to = match[4]!;
    const key = `${from}\0${to}`;
    const occurrence = counts.get(key) ?? 0;
    counts.set(key, occurrence + 1);
    const sourceStart = line.start + match[1]!.length;
    const operatorStart = line.text.indexOf(match[3]!, match.index + match[1]!.length + from.length);
    const targetStart = line.start + operatorStart + match[3]!.length
      + (line.text.slice(operatorStart + match[3]!.length).length - line.text.slice(operatorStart + match[3]!.length).trimStart().length);
    const labelGroup = match[5];
    let labelStart: number | undefined;
    let labelEnd: number | undefined;
    let labelSeparatorStart: number | undefined;
    if (labelGroup !== undefined) {
      const colon = line.text.indexOf(':', targetStart - line.start + to.length);
      let separatorStart = colon;
      while (/\s/.test(line.text[separatorStart - 1] ?? '')) separatorStart--;
      labelSeparatorStart = line.start + separatorStart;
      labelStart = line.start + colon + 1;
      while (/\s/.test(source[labelStart] ?? '')) labelStart++;
      labelEnd = labelStart + labelGroup.trimEnd().length;
    }
    result.push({ source: from, target: to, label: labelGroup?.trim() ?? '', occurrence,
      start: line.start, end: line.end, sourceStart, sourceEnd: sourceStart + from.length,
      targetStart, targetEnd: targetStart + to.length,
      ...(labelSeparatorStart === undefined || labelStart === undefined || labelEnd === undefined ? {} : { labelSeparatorStart, labelStart, labelEnd }) });
  }
  return result;
}

function declarationTokens(source: string): TokenSpan[] {
  const result: TokenSpan[] = [];
  for (const line of linesOutsideNotes(source)) {
    const alias = aliasPattern.exec(line.text);
    if (alias) {
      const start = line.start + alias[1]!.length;
      result.push({ id: alias[2]!, start, end: start + alias[2]!.length });
      continue;
    }
    const declaration = stateDeclarationPattern.exec(line.text);
    if (declaration) {
      const start = line.start + declaration[1]!.length;
      result.push({ id: declaration[2]!, start, end: start + declaration[2]!.length });
      continue;
    }
    const composite = compositePattern.exec(line.text);
    if (composite) {
      const start = line.start + composite[1]!.length;
      result.push({ id: composite[2]!, start, end: start + composite[2]!.length });
    }
  }
  return result;
}

function stateStyleLines(source: string, id: string): Array<{ line: SourceLine; idStart: number; idEnd: number; prefix: string; values: string }> {
  const matches: Array<{ line: SourceLine; idStart: number; idEnd: number; prefix: string; values: string }> = [];
  for (const line of linesOutsideNotes(source)) {
    const match = stylePattern.exec(line.text);
    if (!match || match[2] !== id) continue;
    const idStart = line.start + match[1]!.length;
    const valuesStart = match[3] === undefined ? line.text.length : line.text.lastIndexOf(match[3]);
    const rawPrefix = line.text.slice(0, valuesStart);
    matches.push({ line, idStart, idEnd: idStart + id.length,
      prefix: match[3] === undefined && !/[\t ]$/.test(rawPrefix) ? `${rawPrefix} ` : rawPrefix,
      values: match[3] ?? '' });
  }
  if (matches.length > 1) throw new AmbiguousSourceMutationError('The state has multiple style statements.');
  return matches;
}

function styleProperties(value: string): Map<string, string> {
  const properties = new Map<string, string>();
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: '"' | "'" | undefined;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (escaped) { escaped = false; continue; }
    if (character === '\\') { escaped = true; continue; }
    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === '(') { depth += 1; continue; }
    if (character === ')') {
      depth -= 1;
      if (depth < 0) throw new AmbiguousSourceMutationError('The state style statement is ambiguous.');
      continue;
    }
    if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  if (depth !== 0 || quote || escaped) throw new AmbiguousSourceMutationError('The state style statement is ambiguous.');
  parts.push(value.slice(start));
  for (const part of parts) {
    const separator = part.indexOf(':');
    if (separator <= 0) throw new AmbiguousSourceMutationError('The state style statement is ambiguous.');
    const key = part.slice(0, separator).trim();
    const propertyValue = part.slice(separator + 1).trim();
    if (!/^[\w-]+$/.test(key) || !propertyValue) throw new AmbiguousSourceMutationError('The state style statement is ambiguous.');
    properties.set(key, propertyValue);
  }
  return properties;
}

export type StateStyleProperty = 'fill' | 'stroke' | 'stroke-width' | 'stroke-dasharray';

export type StateBorderType = 'solid' | 'dashed' | 'dotted';

export interface StateAppearance {
  fill: string;
  stroke: string;
  borderType: StateBorderType | '';
}

function stateStyleProperties(source: string, id: string): Map<string, string> {
  diagramBody(source);
  const line = stateStyleLines(source, id)[0];
  return line?.values ? styleProperties(line.values) : new Map<string, string>();
}

function borderTypeFromStyles(styles: ReadonlyMap<string, string>): StateBorderType | '' {
  const dash = styles.get('stroke-dasharray');
  if (dash === '6 4') return 'dashed';
  if (dash === '2 3') return 'dotted';
  if (dash === '0') return 'solid';
  return '';
}

export function getStateAppearance(source: string, id: string): StateAppearance {
  const styles = stateStyleProperties(source, id);
  return { fill: styles.get('fill') ?? '', stroke: styles.get('stroke') ?? '', borderType: borderTypeFromStyles(styles) };
}

export function getStateStyle(source: string, id: string, property: StateStyleProperty): string {
  return stateStyleProperties(source, id).get(property) ?? '';
}

export function setStateStyle(source: string, id: string, property: StateStyleProperty, value: string): string {
  diagramBody(source);
  if (!listStateIds(source).includes(id)) throw new AmbiguousSourceMutationError('The state is missing or ambiguous.');
  const normalized = value.trim();
  if (normalized && property === 'fill' && !/^(?:#[\da-f]{3,8}|[a-z]{1,24})$/i.test(normalized)) {
    throw new AmbiguousSourceMutationError('State colors must be a CSS color name or hexadecimal color.');
  }
  if (normalized && property === 'stroke' && !/^(?:#[\da-f]{3,8}|[a-z]{1,24})$/i.test(normalized)) {
    throw new AmbiguousSourceMutationError('State colors must be a CSS color name or hexadecimal color.');
  }
  if (normalized && property === 'stroke-width' && !/^\d+(?:\.\d+)?(?:px|em|rem)?$/i.test(normalized)) {
    throw new AmbiguousSourceMutationError('State border width is invalid.');
  }
  if (normalized && property === 'stroke-dasharray' && !/^(?:0|2 3|6 4)$/.test(normalized)) {
    throw new AmbiguousSourceMutationError('State border style is unsupported.');
  }
  const existing = stateStyleLines(source, id)[0];
  if (!existing) return normalized ? appendLine(source, `style ${id} ${property}:${normalized}`) : source;
  const properties = existing.values ? styleProperties(existing.values) : new Map<string, string>();
  if (normalized) properties.set(property, normalized);
  else properties.delete(property);
  if (properties.size === 0) {
    const { line } = existing;
    let start = line.start;
    if (line.fullEnd === source.length && !/(?:\r\n|\n|\r)$/.test(line.text) && start > 0) {
      const previousEnding = /(?:\r\n|\n|\r)$/.exec(source.slice(0, start))?.[0];
      if (previousEnding) start -= previousEnding.length;
    }
    return source.slice(0, start) + source.slice(line.fullEnd);
  }
  const updated = `${existing.prefix}${[...properties].map(([key, value]) => `${key}:${value}`).join(',')}`;
  return source.slice(0, existing.line.start) + updated + source.slice(existing.line.end);
}

export function getStateBorderType(source: string, id: string): StateBorderType | '' {
  return borderTypeFromStyles(stateStyleProperties(source, id));
}

export function setStateBorderType(source: string, id: string, border: StateBorderType): string {
  const dash = border === 'dashed' ? '6 4' : border === 'dotted' ? '2 3' : '0';
  return setStateStyle(setStateStyle(source, id, 'stroke-width', '2px'), id, 'stroke-dasharray', dash);
}

function endpointTokens(source: string): TokenSpan[] {
  return transitions(source).flatMap((item) => [
    ...(item.source === '[*]' ? [] : [{ id: item.source, start: item.sourceStart, end: item.sourceEnd }]),
    ...(item.target === '[*]' ? [] : [{ id: item.target, start: item.targetStart, end: item.targetEnd }]),
  ]);
}

function stateReferencePattern(id: string, global = false): RegExp {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}_.])(${escaped})(?=$|[^\\p{L}\\p{N}_.])`, global ? 'gu' : 'u');
}

function lineEnding(source: string): string { return /\r\n|\n|\r/.exec(source)?.[0] ?? '\n'; }

function appendLine(source: string, line: string): string {
  return appendSourceLines(source, [line], 'state');
}

export function listStateIds(source: string): string[] {
  diagramBody(source);
  return [...new Set([...declarationTokens(source), ...endpointTokens(source)].map(({ id }) => id))];
}

export function listStateTransitions(source: string): StateTransition[] {
  diagramBody(source);
  return transitions(source);
}

export function addState(source: string, requestedId?: string): string {
  diagramBody(source);
  const used = new Set(listStateIds(source));
  let id = requestedId;
  if (id === undefined) {
    let index = 1;
    while (used.has(`State${index}`)) index++;
    id = `State${index}`;
  }
  if (!new RegExp(`^${ID}$`).test(id) || used.has(id)) {
    throw new AmbiguousSourceMutationError('The state ID is invalid or already present.');
  }
  return appendLine(source, `state ${id}`);
}

export type StatePaletteItemId = 'simple' | 'composite' | 'choice' | 'note' | 'start-transition' | 'end-transition';

export function addStatePaletteItem(source: string, item: StatePaletteItemId, stateId?: string, label = ''): string {
  diagramBody(source);
  if (item === 'simple') return addState(source);
  if (item === 'composite' || item === 'choice') {
    const used = new Set(listStateIds(source));
    const prefix = item === 'composite' ? 'Composite' : 'Choice';
    let index = 1;
    while (used.has(`${prefix}${index}`)) index++;
    const id = `${prefix}${index}`;
    if (item === 'choice') return appendLine(source, `state ${id} <<choice>>`);
    const ending = lineEnding(source);
    return appendLine(source, `state ${id} {${ending}  ${id}Inner${ending}}`);
  }
  if (item === 'note') {
    const withState = listStateIds(source).length ? source : addState(source);
    const id = listStateIds(withState)[0];
    if (!id) throw new AmbiguousSourceMutationError('A note requires a state to attach to.');
    return appendLine(withState, `note right of ${id} : ${label.trim() || 'Note'}`);
  }
  if (!stateId || !listStateIds(source).includes(stateId)) {
    throw new AmbiguousSourceMutationError('A start or end transition requires an existing state.');
  }
  if (/[\r\n]/.test(label)) throw new AmbiguousSourceMutationError('A transition label must fit on one source line.');
  const transition = item === 'start-transition' ? `[*] --> ${stateId}` : `${stateId} --> [*]`;
  return appendLine(source, `${transition}${label.trim() ? ` : ${label.trim()}` : ''}`);
}

export function renameState(source: string, oldId: string, newId: string): string {
  diagramBody(source);
  if (!new RegExp(`^${ID}$`).test(oldId) || !new RegExp(`^${ID}$`).test(newId) || oldId === newId) {
    throw new AmbiguousSourceMutationError('A state rename requires distinct, valid state IDs.');
  }
  const ids = listStateIds(source);
  if (!ids.includes(oldId)) throw new AmbiguousSourceMutationError('The state is missing or ambiguous.');
  if (ids.includes(newId)) throw new AmbiguousSourceMutationError('The new state ID already exists.');

  const declarations = declarationTokens(source).filter((token) => token.id === oldId);
  if (declarations.length > 1) throw new AmbiguousSourceMutationError('The state declaration is ambiguous.');
  const allowed = [...declarations, ...endpointTokens(source).filter((token) => token.id === oldId)];
  const styleLine = stateStyleLines(source, oldId)[0];
  if (styleLine) allowed.push({ id: oldId, start: styleLine.idStart, end: styleLine.idEnd });
  const ranges = new Set(allowed.map(({ start, end }) => `${start}:${end}`));
  const occurrence = stateReferencePattern(oldId, true);
  for (const line of bodyLines(source)) {
    for (const match of line.text.matchAll(occurrence)) {
      const start = line.start + match.index! + match[1]!.length;
      if (!ranges.has(`${start}:${start + oldId.length}`)) {
        throw new AmbiguousSourceMutationError('The state ID occurs in syntax outside supported state declarations and transitions.');
      }
    }
  }
  let output = source;
  for (const token of allowed.sort((left, right) => right.start - left.start)) {
    output = output.slice(0, token.start) + newId + output.slice(token.end);
  }
  return output;
}

function findTransition(source: string, transition: Pick<StateTransition, 'source' | 'target' | 'occurrence'>): StateTransition {
  const matches = transitions(source).filter((item) => item.source === transition.source && item.target === transition.target
    && item.occurrence === transition.occurrence);
  if (matches.length !== 1) throw new AmbiguousSourceMutationError('The state transition is missing or ambiguous.');
  return matches[0]!;
}

export function setStateTransition(source: string, transition: Pick<StateTransition, 'source' | 'target' | 'occurrence'>,
  patch: Partial<Pick<StateTransition, 'source' | 'target' | 'label'>>): string {
  diagramBody(source);
  const current = findTransition(source, transition);
  const from = patch.source ?? current.source;
  const to = patch.target ?? current.target;
  if ((from !== '[*]' && !new RegExp(`^${ID}$`).test(from)) || (to !== '[*]' && !new RegExp(`^${ID}$`).test(to))) {
    throw new AmbiguousSourceMutationError('A transition requires valid state IDs.');
  }
  const label = patch.label;
  if (label === undefined) {
    let output = source;
    for (const [start, end, replacement] of [
      [current.targetStart, current.targetEnd, to], [current.sourceStart, current.sourceEnd, from],
    ] as const) output = output.slice(0, start) + replacement + output.slice(end);
    return output;
  }
  if (/[\r\n]/.test(label)) throw new AmbiguousSourceMutationError('A transition label must fit on one source line.');
  const encoded = label.trim();
  const formatted = encoded && /[:;"\\]/.test(encoded) ? `"${encoded.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : encoded;
  const edits = [
    ...(current.labelStart !== undefined && current.labelEnd !== undefined
      ? [[!formatted && current.labelSeparatorStart !== undefined ? current.labelSeparatorStart : current.labelStart,
        current.labelEnd, formatted] as const]
      : []),
    [current.targetStart, current.targetEnd, to] as const,
    [current.sourceStart, current.sourceEnd, from] as const,
  ];
  let output = source;
  for (const [start, end, replacement] of edits.sort((left, right) => right[0] - left[0])) {
    output = output.slice(0, start) + replacement + output.slice(end);
  }
  if (current.labelStart === undefined && formatted) {
    const revised = findTransition(output, { source: from, target: to, occurrence: current.occurrence });
    return output.slice(0, revised.end) + ` : ${formatted}` + output.slice(revised.end);
  }
  return output;
}

export function deleteStateTransition(source: string, transition: Pick<StateTransition, 'source' | 'target' | 'occurrence'>): string {
  diagramBody(source);
  const item = findTransition(source, transition);
  const line = linesOf(source).find((candidate) => candidate.start === item.start)!;
  return source.slice(0, line.start) + source.slice(line.fullEnd);
}

export function deleteState(source: string, id: string): string {
  diagramBody(source);
  if (!new RegExp(`^${ID}$`).test(id) || !listStateIds(source).includes(id)) {
    throw new AmbiguousSourceMutationError('The state is missing or has an invalid ID.');
  }
  const lines = bodyLines(source);
  const declarations = declarationTokens(source).filter((token) => token.id === id);
  const headerLines = lines.filter((line) => compositePattern.exec(line.text)?.[2] === id);
  if (headerLines.length) throw new AmbiguousSourceMutationError('Composite states cannot be deleted as a single safe statement.');
  if (declarations.length > 1) throw new AmbiguousSourceMutationError('The state declaration is ambiguous.');
  const edges = transitions(source).filter((item) => item.source === id || item.target === id);
  const lineByStart = new Map(linesOf(source).map((line) => [line.start, line]));
  const ranges = [...declarations.map((token) => {
    const line = lines.find((candidate) => token.start >= candidate.start && token.start < candidate.end)!;
    return { start: line.start, end: line.fullEnd };
  }), ...edges.map((item) => {
    const line = lineByStart.get(item.start)!;
    return { start: line.start, end: line.fullEnd };
  }), ...stateStyleLines(source, id).map(({ line }) => ({ start: line.start, end: line.fullEnd }))];
  const rangeStarts = new Set(ranges.map((range) => range.start));
  const reference = stateReferencePattern(id);
  for (const line of lines) {
    if (reference.test(line.text) && !rangeStarts.has(line.start)) {
      throw new AmbiguousSourceMutationError('The state is referenced outside supported declarations and transitions.');
    }
  }
  let output = source;
  for (const range of [...ranges].sort((left, right) => right.start - left.start)) {
    output = output.slice(0, range.start) + output.slice(range.end);
  }
  return output;
}

export function addStateTransition(source: string, from: string, to: string, label = ''): string {
  diagramBody(source);
  const ids = new Set(listStateIds(source));
  if (!ids.has(from) || !ids.has(to) || from === to) {
    throw new AmbiguousSourceMutationError('A transition requires two existing, distinct states.');
  }
  return appendLine(source, `${from} --> ${to}${label.trim() ? ` : ${label.trim()}` : ''}`);
}
