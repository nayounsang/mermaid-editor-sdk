import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';

export type ERCardinality = 'one-one' | 'one-many' | 'many-many' | 'zero-one' | 'one-or-many';
export type ERKey = string;

export interface ERRelationship {
  source: string;
  target: string;
  cardinality: ERCardinality;
  identifying: boolean;
  label: string;
  occurrence: number;
  start: number;
  end: number;
  sourceStart: number;
  sourceEnd: number;
  operatorStart: number;
  operatorEnd: number;
  targetStart: number;
  targetEnd: number;
  labelStart?: number;
  labelEnd?: number;
  labelSeparatorStart?: number;
}

export interface ERAttribute {
  entity: string;
  type: string;
  name: string;
  key: ERKey;
  comment: string;
  occurrence: number;
}

interface SourceLine { text: string; start: number; end: number; fullEnd: number; }
interface EntityToken { id: string; raw: string; start: number; end: number; }
interface EntityBlock { id: string; header: SourceLine; openEnd: number; close: SourceLine; }
interface AttributeSpan extends ERAttribute { line: SourceLine; valueStart: number; valueEnd: number; }

const ENTITY_TOKEN = '(?:"(?:[^"\\r\\n]|\\\\.)*"|[\\p{L}_][\\p{L}\\p{N}_$.-]*)';
const ENTITY_ID = new RegExp(`^${ENTITY_TOKEN}$`, 'u');
const entityRef = new RegExp(ENTITY_TOKEN, 'uy');
const leftCardinality = '(?:\\|\\||\\|o|\\}o|\\}\\|)';
const middleCardinality = '(?:--|\\.\\.)';
const rightCardinality = '(?:\\|\\||o\\||o\\{|\\|\\{)';
const REL_OPERATOR = `${leftCardinality}${middleCardinality}${rightCardinality}`;
const relationshipLine = new RegExp(`^([\\t ]*)(${ENTITY_TOKEN})([\\t ]+)(${REL_OPERATOR})([\\t ]+)(${ENTITY_TOKEN})(?:[\\t ]*:[\\t ]*(.*?))?[\\t ]*;?[\\t ]*$`, 'u');
const ER_CARD_TERM = '(?:\\|\\||\\|o|\\}o|\\}\\||o\\||o\\{|\\|\\{|(?:one|zero|many|only one)(?:[\\t ]+or[\\t ]+(?:zero|one|more|many))?|many\\([01]\\)|[01]\\+|[0-9]+(?:\\.[0-9]+)?)';
const ER_RELATION_TERM = '(?:--|\\.\\.|optionally[\\t ]+to|to)';
const relaxedRelationshipLine = new RegExp(`^([\\t ]*)(${ENTITY_TOKEN})[\\t ]+(${ER_CARD_TERM})[\\t ]+(${ER_RELATION_TERM})[\\t ]+(${ER_CARD_TERM})[\\t ]+(${ENTITY_TOKEN})(?:[\\t ]*:[\\t ]*.*?)?[\\t ]*;?[\\t ]*$`, 'iu');
const entityBlockLine = new RegExp(`^([\\t ]*)(${ENTITY_TOKEN})[\\t ]*\\{[\\t ]*$`, 'u');
const commentLine = /^[\t ]*(?:%%|%)/;
const endBlockLine = /^[\t ]*}[\t ]*;?[\t ]*$/;
const entityDeclarationLine = new RegExp(`^([\\t ]*)(${ENTITY_TOKEN})[\\t ]*;?[\\t ]*$`, 'u');
const attrLine = /^([\t ]*)([^\s{}]+)([\t ]+)([^\s{}]+)(?:[\t ]+((?:PK|FK|UK)(?:[\t ]*,[\t ]*(?:PK|FK|UK))*))?(?:[\t ]+"([^"\r\n]*)")?([\t ]*;?[\t ]*)$/;

function linesOf(source: string): SourceLine[] {
  const result: SourceLine[] = [];
  const pattern = /[^\r\n]*(?:\r\n|\n|\r|$)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    if (!match[0]) break;
    const ending = /(?:\r\n|\n|\r)$/.exec(match[0])?.[0] ?? '';
    result.push({ text: match[0].slice(0, -ending.length || undefined), start: match.index,
      end: match.index + match[0].length - ending.length, fullEnd: match.index + match[0].length });
  }
  return result;
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
    return !commentLine.test(line.text);
  });
}

function decodeEntity(raw: string): string {
  return raw.startsWith('"') ? raw.slice(1, -1).replace(/\\(["\\])/g, '$1') : raw;
}

function encodeEntity(id: string): string {
  if (!id || /[\r\n"]/u.test(id)) throw new AmbiguousSourceMutationError('The entity ID is invalid.');
  const raw = ENTITY_ID.test(id) ? id : `"${id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  if (!ENTITY_ID.test(raw)) throw new AmbiguousSourceMutationError('The entity ID is invalid.');
  return raw;
}

function tokenAt(line: SourceLine, tokenIndex: number): EntityToken {
  const raw = line.text.slice(tokenIndex);
  entityRef.lastIndex = 0;
  const match = entityRef.exec(raw);
  if (!match) throw new AmbiguousSourceMutationError('The entity ID could not be identified safely.');
  return { id: decodeEntity(match[0]), raw: match[0], start: line.start + tokenIndex, end: line.start + tokenIndex + match[0].length };
}

function assertERDiagram(source: string): void {
  const header = bodyLines(source).find((line) => line.text.trim());
  if (!header || !/^\uFEFF?\s*erDiagram\b/i.test(header.text)) {
    throw new AmbiguousSourceMutationError('An ER mutation requires an erDiagram source.');
  }
}

function relationRows(source: string): ERRelationship[] {
  const counts = new Map<string, number>();
  const result: ERRelationship[] = [];
  for (const line of bodyLines(source)) {
    const match = relationshipLine.exec(line.text);
    if (!match) continue;
    const sourceToken = tokenAt(line, match[1]!.length);
    const operatorStart = line.start + match[1]!.length + match[2]!.length + match[3]!.length;
    const targetToken = tokenAt(line, operatorStart + match[4]!.length + match[5]!.length - line.start);
    const operator = match[4]!;
    const separator = operator.slice(2, 4);
    const left = operator.slice(0, 2);
    const right = operator.slice(-2);
    const relationByEnds: Record<string, ERCardinality> = {
      '||:||': 'one-one', '||:o{': 'one-many', '}o:o{': 'many-many', '|o:||': 'zero-one', '||:|{': 'one-or-many',
    };
    const cardinality = relationByEnds[`${left}:${right}`];
    if (!cardinality || !['--', '..'].includes(separator)) continue;
    const labelGroup = match[7];
    let labelStart: number | undefined;
    let labelEnd: number | undefined;
    let labelSeparatorStart: number | undefined;
    if (labelGroup !== undefined) {
      const colon = line.text.indexOf(':', targetToken.end - line.start);
      labelSeparatorStart = line.start + colon;
      labelStart = line.start + colon + 1;
      while (/\s/.test(source[labelStart] ?? '')) labelStart++;
      labelEnd = labelStart + labelGroup.trimEnd().length;
    }
    const rawLabel = labelGroup?.trim() ?? '';
    const label = rawLabel.startsWith('"') && rawLabel.endsWith('"')
      ? rawLabel.slice(1, -1).replace(/\\(["\\])/g, '$1') : rawLabel;
    const key = `${sourceToken.id}\0${targetToken.id}`;
    const occurrence = counts.get(key) ?? 0;
    counts.set(key, occurrence + 1);
    result.push({ source: sourceToken.id, target: targetToken.id, cardinality, identifying: separator === '--',
      label, occurrence, start: line.start, end: line.end,
      sourceStart: sourceToken.start, sourceEnd: sourceToken.end,
      operatorStart, operatorEnd: operatorStart + operator.length,
      targetStart: targetToken.start, targetEnd: targetToken.end,
      ...(labelStart === undefined || labelEnd === undefined || labelSeparatorStart === undefined
        ? {} : { labelStart, labelEnd, labelSeparatorStart }) });
  }
  return result;
}

function entityBlocks(source: string): EntityBlock[] {
  const lines = bodyLines(source);
  const blocks: EntityBlock[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index]!;
    const match = entityBlockLine.exec(header.text);
    if (!match) continue;
    let closeIndex = index + 1;
    while (closeIndex < lines.length && !endBlockLine.test(lines[closeIndex]!.text)) closeIndex += 1;
    if (closeIndex >= lines.length) throw new AmbiguousSourceMutationError('An unterminated entity attribute block prevents safe mutation.');
    const token = tokenAt(header, match[1]!.length);
    blocks.push({ id: token.id, header, openEnd: header.end, close: lines[closeIndex]! });
    index = closeIndex;
  }
  return blocks;
}

function attributeSpans(source: string, entity: string): AttributeSpan[] {
  const blocks = entityBlocks(source).filter((block) => block.id === entity);
  if (blocks.length > 1) throw new AmbiguousSourceMutationError('The entity has multiple attribute blocks.');
  if (!blocks.length) return [];
  const block = blocks[0]!;
  const result: AttributeSpan[] = [];
  const counts = new Map<string, number>();
  for (const line of bodyLines(source)) {
    if (line.start <= block.header.start || line.start >= block.close.start) continue;
    if (!line.text.trim() || commentLine.test(line.text) || /^\s*note\b/i.test(line.text)) continue;
    const match = attrLine.exec(line.text);
    if (!match) throw new AmbiguousSourceMutationError('An unsupported attribute statement prevents safe entity editing.');
    const name = match[4]!;
    const occurrence = counts.get(name) ?? 0;
    counts.set(name, occurrence + 1);
    result.push({ entity, type: match[2]!, name, key: (match[5]?.trim() ?? '') as ERKey,
      comment: match[6] ?? '', occurrence, line,
      valueStart: line.start + match[1]!.length, valueEnd: line.end - match[7]!.length });
  }
  return result;
}

function entityTokenSpans(source: string): EntityToken[] {
  const result: EntityToken[] = [];
  for (const line of bodyLines(source)) {
    const block = entityBlockLine.exec(line.text);
    if (block) result.push(tokenAt(line, block[1]!.length));
    else if (!/^\s*erDiagram\b/i.test(line.text)) {
      const declaration = entityDeclarationLine.exec(line.text);
      if (declaration) result.push(tokenAt(line, declaration[1]!.length));
    }
    const relation = relationshipLine.exec(line.text);
    if (relation) {
      result.push(tokenAt(line, relation[1]!.length));
      const operatorStart = relation[1]!.length + relation[2]!.length + relation[3]!.length;
      result.push(tokenAt(line, operatorStart + relation[4]!.length + relation[5]!.length));
    }
  }
  return result;
}

function fallbackRelationshipTokens(source: string): EntityToken[] {
  const result: EntityToken[] = [];
  for (const line of bodyLines(source)) {
    if (relationshipLine.test(line.text)) continue;
    const match = relaxedRelationshipLine.exec(line.text);
    if (!match) continue;
    result.push(tokenAt(line, match[1]!.length));
    const relationText = match[0]!;
    const colon = relationText.indexOf(':');
    const endpointText = colon < 0 ? relationText : relationText.slice(0, colon);
    const targetStart = relationText.indexOf(match[6]!, endpointText.indexOf(match[2]!) + match[2]!.length);
    result.push(tokenAt(line, targetStart));
  }
  return result;
}

function styleLines(source: string, id: string): Array<{ line: SourceLine; token: EntityToken }> {
  const result: Array<{ line: SourceLine; token: EntityToken }> = [];
  for (const line of bodyLines(source)) {
    const match = /^([\t ]*style[\t ]+)/.exec(line.text);
    if (!match) continue;
    const token = tokenAt(line, match[1]!.length);
    if (token.id === id) result.push({ line, token });
  }
  if (result.length > 1) throw new AmbiguousSourceMutationError('The entity has multiple style statements.');
  return result;
}

function lineEnding(source: string): string { return /\r\n|\n|\r/.exec(source)?.[0] ?? '\n'; }

function appendLine(source: string, value: string): string {
  return appendSourceLines(source, [value], 'er');
}

function cardinalityTokens(cardinality: ERCardinality): string {
  const tokens: Record<ERCardinality, string> = {
    'one-one': '||--||', 'one-many': '||--o{', 'many-many': '}o--o{',
    'zero-one': '|o--||', 'one-or-many': '||--|{',
  };
  return tokens[cardinality];
}

export function listEREntityIds(source: string): string[] {
  assertERDiagram(source);
  return [...new Set([...entityTokenSpans(source), ...fallbackRelationshipTokens(source)].map(({ id }) => id))];
}

export function listERRelationships(source: string): ERRelationship[] {
  assertERDiagram(source);
  return relationRows(source);
}

export function listERAttributes(source: string, entity: string): ERAttribute[] {
  assertERDiagram(source);
  if (!listEREntityIds(source).includes(entity)) throw new AmbiguousSourceMutationError('The entity is missing or ambiguous.');
  return attributeSpans(source, entity).map(({ entity: id, type, name, key, comment, occurrence }) => ({ entity: id, type, name, key, comment, occurrence }));
}

export function addEREntity(source: string, requestedId?: string): string {
  assertERDiagram(source);
  const ids = new Set(listEREntityIds(source));
  let id = requestedId;
  if (id === undefined) {
    let index = 1;
    while (ids.has(`Entity${index}`)) index++;
    id = `Entity${index}`;
  }
  const token = encodeEntity(id);
  if (ids.has(id)) throw new AmbiguousSourceMutationError('The entity ID already exists.');
  const ending = lineEnding(source);
  return appendLine(source, `${token} {${ending}}`);
}

export function renameEREntity(source: string, oldId: string, newId: string): string {
  assertERDiagram(source);
  const replacement = encodeEntity(newId);
  const ids = listEREntityIds(source);
  if (!ids.includes(oldId) || oldId === newId || ids.includes(newId)) {
    throw new AmbiguousSourceMutationError('The entity is missing, ambiguous, or the new ID is already present.');
  }
  const spans = entityTokenSpans(source);
  const relations = relationRows(source);
  const relationStarts = new Set(relations.flatMap(({ sourceStart, targetStart }) => [sourceStart, targetStart]));
  const declarations = spans.filter((token) => token.id === oldId && !relationStarts.has(token.start));
  if (declarations.length > 1) {
    throw new AmbiguousSourceMutationError('The entity declaration is ambiguous.');
  }
  const allowed = spans.filter((token) => token.id === oldId);
  const styles = styleLines(source, oldId);
  allowed.push(...styles.map(({ token }) => token));
  const allowedRanges = new Set(allowed.map(({ start, end }) => `${start}:${end}`));
  const rawId = encodeEntity(oldId);
  const escaped = rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ref = new RegExp(`(^|[^\\p{L}\\p{N}_$.-])(${escaped})(?=$|[^\\p{L}\\p{N}_$.-])`, 'gu');
  for (const line of bodyLines(source)) {
    for (const match of line.text.matchAll(ref)) {
      const start = line.start + match.index! + match[1]!.length;
      if (!allowedRanges.has(`${start}:${start + rawId.length}`)) {
        throw new AmbiguousSourceMutationError('The entity ID occurs in syntax outside supported declarations and relationships.');
      }
    }
  }
  let output = source;
  for (const token of allowed.sort((left, right) => right.start - left.start)) {
    output = output.slice(0, token.start) + replacement + output.slice(token.end);
  }
  return output;
}

export function deleteEREntity(source: string, id: string): string {
  assertERDiagram(source);
  const ids = listEREntityIds(source);
  if (!ids.includes(id)) throw new AmbiguousSourceMutationError('The entity is missing or ambiguous.');
  const blocks = entityBlocks(source).filter((block) => block.id === id);
  const relations = relationRows(source);
  const relationStarts = new Set(relations.flatMap(({ sourceStart, targetStart }) => [sourceStart, targetStart]));
  const declarations = entityTokenSpans(source).filter((token) => token.id === id && !relationStarts.has(token.start));
  if (blocks.length > 1 || declarations.length > 1) throw new AmbiguousSourceMutationError('The entity declaration is ambiguous.');
  const relationships = relations.filter((relationship) => relationship.source === id || relationship.target === id);
  const styles = styleLines(source, id);
  const sourceLines = linesOf(source);
  const sourceLinesByStart = new Map(sourceLines.map((line) => [line.start, line]));
  const blockRanges = blocks.map(({ header, close }) => ({ start: header.start, end: close.fullEnd }));
  const singleLineRanges = [
    ...declarations.filter((token) => !blocks.some((block) => block.header.start === token.start)).map((token) => {
      const line = sourceLines.find((candidate) => candidate.start <= token.start && candidate.end >= token.end)!;
      return { start: line.start, end: line.fullEnd };
    }),
    ...relationships.map((relationship) => {
      const line = sourceLinesByStart.get(relationship.start)!;
      return { start: line.start, end: line.fullEnd };
    }),
    ...styles.map(({ line }) => ({ start: line.start, end: line.fullEnd })),
  ];
  const allowedReferenceLines = new Set(singleLineRanges.map(({ start }) => start));
  const ranges = [...blockRanges, ...singleLineRanges];
  const rawId = encodeEntity(id);
  const escaped = rawId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ref = new RegExp(`(^|[^\\p{L}\\p{N}_$.-])${escaped}(?=$|[^\\p{L}\\p{N}_$.-])`, 'u');
  for (const line of bodyLines(source)) {
    const insideAttributeBlock = blockRanges.some((range) => line.start >= range.start && line.start < range.end);
    if (ref.test(line.text) && !allowedReferenceLines.has(line.start) && !insideAttributeBlock) {
      throw new AmbiguousSourceMutationError('The entity is referenced outside supported declarations and relationships.');
    }
  }
  let output = source;
  for (const range of ranges.sort((left, right) => right.start - left.start)) {
    output = output.slice(0, range.start) + output.slice(range.end);
  }
  return output;
}

function attributeKey(value: string): ERKey {
  const normalized = value.trim().replace(/[\t ]/g, '');
  if (!normalized || /^(?:PK|FK|UK)(?:,(?:PK|FK|UK))*$/.test(normalized)) return value.trim();
  throw new AmbiguousSourceMutationError('Attribute keys must use PK, FK, or UK markers.');
}

function formatAttribute(attribute: Pick<ERAttribute, 'type' | 'name' | 'key' | 'comment'>): string {
  const type = attribute.type.trim();
  const name = attribute.name.trim();
  if (!type || !name || /[\s{}";]/.test(type) || /[\s{}";]/.test(name)) {
    throw new AmbiguousSourceMutationError('An attribute type and name must each fit on one source token.');
  }
  const key = attributeKey(attribute.key);
  const comment = attribute.comment.trim();
  if (/[\r\n"]/.test(comment)) throw new AmbiguousSourceMutationError('An attribute comment cannot contain quotes or newlines.');
  return `${type} ${name}${key ? ` ${key}` : ''}${comment ? ` "${comment}"` : ''}`;
}

export function setERAttribute(source: string, entity: string, attribute: Pick<ERAttribute, 'name' | 'occurrence'>,
  patch: Partial<Pick<ERAttribute, 'type' | 'name' | 'key' | 'comment'>>): string {
  assertERDiagram(source);
  const matches = attributeSpans(source, entity).filter((item) => item.name === attribute.name && item.occurrence === attribute.occurrence);
  if (matches.length !== 1) throw new AmbiguousSourceMutationError('The entity attribute is missing or ambiguous.');
  const current = matches[0]!;
  const next = { type: patch.type ?? current.type, name: patch.name ?? current.name,
    key: patch.key ?? current.key, comment: patch.comment ?? current.comment };
  const updated = `${current.line.text.slice(0, current.valueStart - current.line.start)}${formatAttribute(next)}${current.line.text.slice(current.valueEnd - current.line.start)}`;
  return source.slice(0, current.line.start) + updated + source.slice(current.line.end);
}

export function addERAttribute(source: string, entity: string, attribute: Partial<Pick<ERAttribute, 'type' | 'name' | 'key' | 'comment'>> = {}): string {
  assertERDiagram(source);
  if (!listEREntityIds(source).includes(entity)) throw new AmbiguousSourceMutationError('The entity is missing or ambiguous.');
  const blocks = entityBlocks(source).filter((block) => block.id === entity);
  if (blocks.length > 1) throw new AmbiguousSourceMutationError('The entity has multiple attribute blocks.');
  const attrs = attributeSpans(source, entity);
  let name = attribute.name?.trim();
  if (!name) {
    let index = 1;
    const names = new Set(attrs.map((item) => item.name));
    while (names.has(`attribute${index}`)) index++;
    name = `attribute${index}`;
  }
  const line = formatAttribute({ type: attribute.type ?? 'string', name, key: attribute.key ?? '', comment: attribute.comment ?? '' });
  const ending = lineEnding(source);
  if (blocks.length) {
    const block = blocks[0]!;
    const beforeClose = source.slice(block.openEnd, block.close.start);
    const indent = /^(\s*)/.exec(block.close.text)![1]! + '  ';
    const insertion = beforeClose.length > 0 && /(?:\r\n|\n|\r)$/.test(beforeClose)
      ? `${indent}${line}${ending}` : `${ending}${indent}${line}${ending}`;
    return source.slice(0, block.close.start) + insertion + source.slice(block.close.start);
  }
  return appendLine(source, `${encodeEntity(entity)} {${ending}  ${line}${ending}}`);
}

export function deleteERAttribute(source: string, entity: string, attribute: Pick<ERAttribute, 'name' | 'occurrence'>): string {
  assertERDiagram(source);
  const matches = attributeSpans(source, entity).filter((item) => item.name === attribute.name && item.occurrence === attribute.occurrence);
  if (matches.length !== 1) throw new AmbiguousSourceMutationError('The entity attribute is missing or ambiguous.');
  const line = matches[0]!.line;
  return source.slice(0, line.start) + source.slice(line.fullEnd);
}

function findRelationship(source: string, relationship: Pick<ERRelationship, 'source' | 'target' | 'occurrence'>): ERRelationship {
  const matches = relationRows(source).filter((item) => item.source === relationship.source && item.target === relationship.target
    && item.occurrence === relationship.occurrence);
  if (matches.length !== 1) throw new AmbiguousSourceMutationError('The ER relationship is missing or ambiguous.');
  return matches[0]!;
}

export function addERRelationship(source: string, from: string, to: string, cardinality: ERCardinality = 'one-many', label = 'relates', identifying = true): string {
  assertERDiagram(source);
  const ids = new Set(listEREntityIds(source));
  if (!ids.has(from) || !ids.has(to) || from === to) throw new AmbiguousSourceMutationError('An ER relationship requires two existing, distinct entities.');
  const operator = cardinalityTokens(cardinality).replace('--', identifying ? '--' : '..');
  const text = label.trim();
  if (/[\r\n]/.test(text)) throw new AmbiguousSourceMutationError('An ER relationship label must fit on one source line.');
  const formatted = text && /[\s:;"\\]/.test(text) ? `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : text;
  return appendLine(source, `${encodeEntity(from)} ${operator} ${encodeEntity(to)}${formatted ? ` : ${formatted}` : ''}`);
}

export function setERRelationship(source: string, relationship: Pick<ERRelationship, 'source' | 'target' | 'occurrence'>,
  patch: Partial<Pick<ERRelationship, 'source' | 'target' | 'cardinality' | 'label' | 'identifying'>>): string {
  assertERDiagram(source);
  const current = findRelationship(source, relationship);
  const from = patch.source ?? current.source;
  const to = patch.target ?? current.target;
  if (from === to || !listEREntityIds(source).includes(from) || !listEREntityIds(source).includes(to)) {
    throw new AmbiguousSourceMutationError('An ER relationship requires two existing, distinct entities.');
  }
  const cardinality = patch.cardinality ?? current.cardinality;
  const identifying = patch.identifying ?? current.identifying;
  const operator = cardinalityTokens(cardinality).replace('--', identifying ? '--' : '..');
  const edits: Array<[number, number, string]> = [
    [current.targetStart, current.targetEnd, encodeEntity(to)],
    [current.operatorStart, current.operatorEnd, operator],
    [current.sourceStart, current.sourceEnd, encodeEntity(from)],
  ];
  let output = source;
  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (/[\r\n]/.test(label)) throw new AmbiguousSourceMutationError('An ER relationship label must fit on one source line.');
    const formatted = label && /[\s:;"\\]/.test(label) ? `"${label.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : label;
    if (current.labelStart !== undefined && current.labelEnd !== undefined && current.labelSeparatorStart !== undefined) {
      edits.push([!formatted ? current.labelSeparatorStart : current.labelStart, current.labelEnd, formatted]);
    } else if (formatted) {
      const line = linesOf(source).find((candidate) => candidate.start === current.start)!;
      const next = [...edits].sort((left, right) => right[0] - left[0]);
      let rewritten = line.text;
      for (const [start, end, replacement] of next) rewritten = rewritten.slice(0, start - line.start) + replacement + rewritten.slice(end - line.start);
      return source.slice(0, line.start) + `${rewritten} : ${formatted}` + source.slice(line.end);
    }
  }
  for (const [start, end, replacement] of edits.sort((left, right) => right[0] - left[0])) {
    output = output.slice(0, start) + replacement + output.slice(end);
  }
  return output;
}

export function deleteERRelationship(source: string, relationship: Pick<ERRelationship, 'source' | 'target' | 'occurrence'>): string {
  assertERDiagram(source);
  const current = findRelationship(source, relationship);
  const line = linesOf(source).find((candidate) => candidate.start === current.start)!;
  return source.slice(0, line.start) + source.slice(line.fullEnd);
}

export type ERStyleProperty = 'fill' | 'stroke' | 'stroke-dasharray';

function erStyleLines(source: string, id: string): Array<{ line: SourceLine; prefix: string; values: string }> {
  const result: Array<{ line: SourceLine; prefix: string; values: string }> = [];
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^([\\t ]*style[\\t ]+${escaped})(?:[\\t ]+(.*))?$`, 'u');
  for (const line of bodyLines(source)) {
    const match = pattern.exec(line.text);
    if (match) result.push({ line, prefix: match[1]!, values: match[2] ?? '' });
  }
  if (result.length > 1) throw new AmbiguousSourceMutationError('The entity has multiple style statements.');
  return result;
}

function styleProperties(value: string): Map<string, string> {
  const result = new Map<string, string>();
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: '"' | "'" | undefined;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (escaped) { escaped = false; continue; }
    if (character === '\\') { escaped = true; continue; }
    if (quote) { if (character === quote) quote = undefined; continue; }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === '(') { depth += 1; continue; }
    if (character === ')') {
      depth -= 1;
      if (depth < 0) throw new AmbiguousSourceMutationError('The entity style statement is ambiguous.');
      continue;
    }
    if (character === ',' && depth === 0) { parts.push(value.slice(start, index)); start = index + 1; }
  }
  if (depth || quote || escaped) throw new AmbiguousSourceMutationError('The entity style statement is ambiguous.');
  parts.push(value.slice(start));
  for (const item of parts) {
    const separator = item.indexOf(':');
    if (separator <= 0) throw new AmbiguousSourceMutationError('The entity style statement is ambiguous.');
    const key = item.slice(0, separator).trim();
    const property = item.slice(separator + 1).trim();
    if (!/^[\w-]+$/.test(key) || !property) throw new AmbiguousSourceMutationError('The entity style statement is ambiguous.');
    result.set(key, property);
  }
  return result;
}

export function getERStyles(source: string, id: string): Readonly<Record<ERStyleProperty, string>> {
  assertERDiagram(source);
  const line = erStyleLines(source, id)[0];
  const properties = line?.values ? styleProperties(line.values) : new Map<string, string>();
  return { fill: properties.get('fill') ?? '', stroke: properties.get('stroke') ?? '', 'stroke-dasharray': properties.get('stroke-dasharray') ?? '' };
}

export function getERStyle(source: string, id: string, property: ERStyleProperty): string {
  return getERStyles(source, id)[property];
}

export function setERStyle(source: string, id: string, property: ERStyleProperty, color: string): string {
  assertERDiagram(source);
  if (!listEREntityIds(source).includes(id)) throw new AmbiguousSourceMutationError('The entity is missing or ambiguous.');
  const value = color.trim();
  if (value && (property === 'stroke-dasharray' ? !/^(?:0|6 4|2 3)$/.test(value) : !/^(?:#[\da-f]{3,8}|[a-z]{1,24})$/i.test(value))) {
    throw new AmbiguousSourceMutationError(property === 'stroke-dasharray' ? 'Entity border line style is not supported.' : 'Entity colors must be a CSS color name or hexadecimal color.');
  }
  const existing = erStyleLines(source, id)[0];
  const styles = existing?.values ? styleProperties(existing.values) : new Map<string, string>();
  if (value) styles.set(property, value);
  else styles.delete(property);
  if (!existing) return value ? appendLine(source, `style ${encodeEntity(id)} ${property}:${value}`) : source;
  if (!styles.size) return source.slice(0, existing.line.start) + source.slice(existing.line.fullEnd);
  return source.slice(0, existing.line.start) + `${existing.prefix} ${[...styles].map(([key, item]) => `${key}:${item}`).join(',')}` + source.slice(existing.line.end);
}
