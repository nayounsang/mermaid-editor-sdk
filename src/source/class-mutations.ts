import { AmbiguousSourceMutationError } from './source-document';

export type ClassRelationOperator = '<|--' | '--|>' | '*--' | '--*' | 'o--' | '--o' | '<--' | '-->' | '<..' | '..>' | '<|..' | '..|>' | '--' | '..';

export interface ClassRelation {
  source: string;
  target: string;
  operator: ClassRelationOperator;
  occurrence: number;
}

interface RelationSpan extends ClassRelation {
  start: number;
  end: number;
  operatorStart: number;
  operatorEnd: number;
  sourceStart: number;
  sourceEnd: number;
  targetStart: number;
  targetEnd: number;
}

const relationOperators: readonly ClassRelationOperator[] = ['<|--', '--|>', '<|..', '..|>', '*--', '--*', 'o--', '--o', '<--', '-->', '<..', '..>', '--', '..'];
const escapePattern = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const operatorAlternation = relationOperators.map(escapePattern).join('|');
const classIdSource = '[\\p{L}_$][\\p{L}\\p{N}_$.-]*';
const quotedMultiplicity = '(?:"[^"\\r\\n]*"\\s+)?';
const relationLine = new RegExp(`^(\\s*)(${classIdSource})(\\s+${quotedMultiplicity})(${operatorAlternation})(\\s+${quotedMultiplicity})(${classIdSource})(.*)$`, 'u');
const identifier = new RegExp(`^${classIdSource}$`, 'u');
const classDeclarationPattern = new RegExp(`^\\s*class\\s+(${classIdSource})`, 'gmu');

function isEditableMember(member: string): boolean {
  return Boolean(member) && !member.startsWith('%%') && !/^<<.*>>$/.test(member);
}

function assertClassDiagram(source: string): void {
  if (!/^\uFEFF?\s*classDiagram(?:-v2)?\b/im.test(source)) {
    throw new AmbiguousSourceMutationError('A class mutation requires a classDiagram source.');
  }
}

function classDiagramBody(source: string): { text: string; offset: number } {
  const header = /^\uFEFF?\s*classDiagram(?:-v2)?\b/im.exec(source);
  if (!header) return { text: source, offset: 0 };
  const offset = header.index + header[0].length;
  return { text: source.slice(offset), offset };
}

function lineEnding(source: string): string {
  return /\r\n|\n|\r/.exec(source)?.[0] ?? '\n';
}

function appendLine(source: string, statement: string): string {
  const ending = lineEnding(source);
  return `${source}${/(?:\r\n|\n|\r)$/.test(source) ? '' : ending}${statement}${/(?:\r\n|\n|\r)$/.test(source) ? '' : ending}`;
}

function scanRelations(source: string): RelationSpan[] {
  const result: RelationSpan[] = [];
  const counts = new Map<string, number>();
  let offset = 0;
  for (const rawLine of source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? []) {
    if (!rawLine) continue;
    const endingLength = rawLine.endsWith('\r\n') ? 2 : /[\r\n]$/.test(rawLine) ? 1 : 0;
    const line = rawLine.slice(0, rawLine.length - endingLength);
    if (!line.trimStart().startsWith('%%')) {
      const match = relationLine.exec(line);
      if (match) {
        const sourceStart = offset + match[1]!.length;
        const sourceEnd = sourceStart + match[2]!.length;
        const operatorStart = offset + match[1]!.length + match[2]!.length + match[3]!.length;
        const operatorEnd = operatorStart + match[4]!.length;
        const targetStart = operatorEnd + match[5]!.length;
        const targetEnd = targetStart + match[6]!.length;
        const pair = `${match[2]}\0${match[6]}`;
        const occurrence = counts.get(pair) ?? 0;
        counts.set(pair, occurrence + 1);
        result.push({ source: match[2]!, target: match[6]!, operator: match[4]! as ClassRelationOperator,
          occurrence, start: offset, end: offset + line.length, sourceStart, sourceEnd,
          operatorStart, operatorEnd, targetStart, targetEnd });
      }
    }
    offset += rawLine.length;
  }
  return result;
}

export function listClassRelations(source: string): ClassRelation[] {
  return scanRelations(source).map(({ source: from, target, operator, occurrence }) => ({ source: from, target, operator, occurrence }));
}

export function listClassIds(source: string): string[] {
  const ids = new Set<string>();
  const { text } = classDiagramBody(source);
  for (const match of text.matchAll(classDeclarationPattern)) ids.add(match[1]!);
  const colonClassPattern = new RegExp(`^\\s*(${classIdSource})\\s*:\\s*\\S`, 'gmu');
  let inNote = false;
  for (const line of text.split(/\r\n|\n|\r/)) {
    if (/^\s*note\b/i.test(line)) { inNote = true; continue; }
    if (/^\s*end\s+note\b/i.test(line)) { inNote = false; continue; }
    if (!inNote) {
      const match = colonClassPattern.exec(line);
      if (match) ids.add(match[1]!);
      colonClassPattern.lastIndex = 0;
    }
  }
  for (const relation of scanRelations(source)) {
    ids.add(relation.source);
    ids.add(relation.target);
  }
  return [...ids];
}

export function addClassNode(source: string, id?: string): string {
  assertClassDiagram(source);
  const used = new Set<string>();
  for (const match of source.matchAll(classDeclarationPattern)) used.add(match[1]!);
  const actualId = id ?? (() => {
    let index = 1;
    while (used.has(`Class${index}`)) index++;
    return `Class${index}`;
  })();
  if (!identifier.test(actualId) || used.has(actualId)) {
    throw new AmbiguousSourceMutationError('The class ID is invalid or already declared.');
  }
  return appendLine(source, `class ${actualId} {${lineEnding(source)}  ${lineEnding(source)}}`);
}

export function renameClassNode(source: string, oldId: string, newId: string): string {
  assertClassDiagram(source);
  if (!identifier.test(oldId) || !identifier.test(newId) || oldId === newId) {
    throw new AmbiguousSourceMutationError('A class rename requires distinct, valid class IDs.');
  }
  if (listClassIds(source).includes(newId)) throw new AmbiguousSourceMutationError('The new class ID already exists.');
  const declarationPattern = new RegExp(`^(\\s*class\\s+)(${escapePattern(oldId)})(?=\\s|\\[|\\{|$)(.*)$`, 'gm');
  const declarations = [...source.matchAll(declarationPattern)];
  if (declarations.length !== 1) throw new AmbiguousSourceMutationError('The class declaration is missing or ambiguous.');
  const declaration = declarations[0]!;
  const declarationIdStart = declaration.index! + declaration[1]!.length;
  const declarationIdEnd = declarationIdStart + oldId.length;
  const relationSpans = scanRelations(source).flatMap((relation) => [
    ...(relation.source === oldId ? [[relation.sourceStart, relation.sourceEnd] as const] : []),
    ...(relation.target === oldId ? [[relation.targetStart, relation.targetEnd] as const] : []),
  ]);
  const accepted = [
    { start: declaration.index!, end: declaration.index! + declaration[0].length },
    ...scanRelations(source).filter((relation) => relation.source === oldId || relation.target === oldId)
      .map(({ start, end }) => ({ start, end })),
  ];
  let offset = 0;
  for (const rawLine of source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? []) {
    const line = rawLine.replace(/[\r\n]+$/, '');
    if (!line.trimStart().startsWith('%') && new RegExp(`\\b${escapePattern(oldId)}\\b`).test(line)
      && !accepted.some((range) => offset >= range.start && offset < range.end)) {
      throw new AmbiguousSourceMutationError('The class ID occurs in syntax outside supported declarations and relations.');
    }
    offset += rawLine.length;
  }
  const replacements = [
    [declarationIdStart, declarationIdEnd] as const,
    ...relationSpans,
  ].sort((left, right) => right[0] - left[0]);
  let output = source;
  for (const [start, end] of replacements) output = output.slice(0, start) + newId + output.slice(end);
  return output;
}

export function addClassRelation(source: string, from: string, to: string, operator: ClassRelationOperator = '-->'): string {
  assertClassDiagram(source);
  if (!identifier.test(from) || !identifier.test(to) || from === to) {
    throw new AmbiguousSourceMutationError('A class relation requires two distinct, valid class IDs.');
  }
  return appendLine(source, `${from} ${operator} ${to}`);
}

function findRelation(source: string, relation: ClassRelation): RelationSpan {
  const matches = scanRelations(source).filter((candidate) => candidate.source === relation.source
    && candidate.target === relation.target && candidate.occurrence === relation.occurrence);
  if (matches.length !== 1) throw new AmbiguousSourceMutationError('The class relation is missing or ambiguous.');
  return matches[0]!;
}

export function setClassRelation(source: string, relation: ClassRelation, patch: Partial<Pick<ClassRelation, 'source' | 'target' | 'operator'>>): string {
  assertClassDiagram(source);
  const span = findRelation(source, relation);
  const from = patch.source ?? relation.source;
  const to = patch.target ?? relation.target;
  const operator = patch.operator ?? relation.operator;
  if (!identifier.test(from) || !identifier.test(to) || from === to) {
    throw new AmbiguousSourceMutationError('A class relation requires two distinct, valid class IDs.');
  }
  let output = source;
  for (const [start, end, replacement] of [
    [span.targetStart, span.targetEnd, to],
    [span.operatorStart, span.operatorEnd, operator],
    [span.sourceStart, span.sourceEnd, from],
  ] as const) {
    output = output.slice(0, start) + replacement + output.slice(end);
  }
  return output;
}

function lineRemovalSpan(source: string, start: number, end: number): [number, number] {
  const lineEnd = source.indexOf('\n', end);
  if (lineEnd >= 0) return [start, lineEnd + 1];
  const previousCr = source[end] === '\r' ? end + 1 : end;
  return [start, previousCr];
}

export function deleteClassRelation(source: string, relation: ClassRelation): string {
  assertClassDiagram(source);
  const span = findRelation(source, relation);
  const [start, end] = lineRemovalSpan(source, span.start, span.end);
  return source.slice(0, start) + source.slice(end);
}

export function deleteClassNode(source: string, id: string): string {
  assertClassDiagram(source);
  if (!identifier.test(id)) throw new AmbiguousSourceMutationError('The class ID is invalid.');
  const declarationPattern = new RegExp(`^\\s*class\\s+${escapePattern(id)}(?:\\s*(?:\\{.*)?|\\s*\\[[^\\r\\n]*\\])\\s*$`, 'gmu');
  const declarations = [...source.matchAll(declarationPattern)];
  if (declarations.length !== 1) throw new AmbiguousSourceMutationError('The class declaration is missing or ambiguous.');
  const declaration = declarations[0]!;
  let definitionStart = declaration.index!;
  let definitionEnd = definitionStart + declaration[0].length;
  if (declaration[0].includes('{')) {
    const block = findClassBlock(source, id);
    definitionStart = block.start;
    const closeEnd = source.indexOf('\n', block.closeStart);
    definitionEnd = closeEnd < 0 ? source.length : closeEnd;
  }
  const relations = scanRelations(source).filter((relation) => relation.source === id || relation.target === id);
  const removableRanges = [
    { start: definitionStart, end: definitionEnd },
    ...relations.map(({ start, end }) => ({ start, end })),
  ];
  const rangeContains = (start: number, end: number, index: number): boolean => index >= start && index < end;
  const opaqueReference = new RegExp(`\\b${escapePattern(id)}\\b`);
  let offset = 0;
  for (const rawLine of source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? []) {
    const line = rawLine.replace(/[\r\n]+$/, '');
    const isComment = line.trimStart().startsWith('%');
    if (!isComment && opaqueReference.test(line)
      && !removableRanges.some((range) => rangeContains(range.start, range.end, offset))) {
      throw new AmbiguousSourceMutationError('The class has references outside supported class and relation statements.');
    }
    offset += rawLine.length;
  }
  let output = source;
  for (const range of [...removableRanges].sort((left, right) => right.start - left.start)) {
    const [start, end] = lineRemovalSpan(output, range.start, range.end);
    output = output.slice(0, start) + output.slice(end);
  }
  return output;
}

interface ClassBlock { start: number; openEnd: number; closeStart: number; id: string; }

function findClassBlock(source: string, id: string): ClassBlock {
  const blocks: ClassBlock[] = [];
  const lines = source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? [];
  let offset = 0;
  let active: { id: string; start: number; openEnd: number } | undefined;
  for (const rawLine of lines) {
    if (!rawLine) continue;
    const endingLength = rawLine.endsWith('\r\n') ? 2 : /[\r\n]$/.test(rawLine) ? 1 : 0;
    const line = rawLine.slice(0, rawLine.length - endingLength);
    if (!active) {
      const open = new RegExp(`^\\s*class\\s+(${classIdSource})\\s*\\{\\s*$`, 'u').exec(line);
      if (open?.[1] === id) active = { id, start: offset, openEnd: offset + line.length };
    } else if (/^\s*}\s*;?\s*$/.test(line)) {
      blocks.push({ ...active, closeStart: offset });
      active = undefined;
    }
    offset += rawLine.length;
  }
  if (blocks.length !== 1) throw new AmbiguousSourceMutationError('The class block is missing, unsupported, or ambiguous.');
  return blocks[0]!;
}

export function listClassMembers(source: string, id: string): string[] {
  try {
    const block = findClassBlock(source, id);
    return source.slice(block.openEnd, block.closeStart).split(/\r\n|\n|\r/)
      .map((line) => line.trim()).filter(isEditableMember);
  } catch (error) {
    const entries = findColonClassMembers(source, id);
    if (entries.length) return entries.map((entry) => entry.member);
    throw error;
  }
}

interface ClassMemberSpan { start: number; end: number; member: string; }

function findColonClassMembers(source: string, id: string): ClassMemberSpan[] {
  const memberLine = new RegExp(`^(\\s*)${escapePattern(id)}(\\s*:\\s*)(.*)$`, 'u');
  const entries: ClassMemberSpan[] = [];
  const { text, offset: baseOffset } = classDiagramBody(source);
  let offset = baseOffset;
  let inNote = false;
  for (const rawLine of text.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? []) {
    if (!rawLine) continue;
    const line = rawLine.replace(/[\r\n]+$/, '');
    if (/^\s*note\b/i.test(line)) { inNote = true; offset += rawLine.length; continue; }
    if (/^\s*end\s+note\b/i.test(line)) { inNote = false; offset += rawLine.length; continue; }
    const match = memberLine.exec(line);
    const member = match?.[3]?.trim();
    if (!inNote && match && member && isEditableMember(member)) {
      const leading = match[3]!.length - match[3]!.trimStart().length;
      const trailing = match[3]!.length - match[3]!.trimEnd().length;
      const start = offset + match[1]!.length + id.length + match[2]!.length + leading;
      entries.push({ start, end: offset + line.length - trailing, member });
    }
    offset += rawLine.length;
  }
  return entries;
}

export function setClassMember(source: string, classId: string, oldMember: string, newMember: string): string {
  assertClassDiagram(source);
  if (!identifier.test(classId) || !isEditableMember(oldMember.trim()) || !isEditableMember(newMember.trim()) || /[\r\n{}]/.test(newMember)) {
    throw new AmbiguousSourceMutationError('The class member replacement is not one supported member line.');
  }
  let entries: ClassMemberSpan[];
  try {
    const block = findClassBlock(source, classId);
    const body = source.slice(block.openEnd, block.closeStart);
    entries = [...body.matchAll(/[^\r\n]+/g)]
      .filter((match) => isEditableMember(match[0]!.trim()) && match[0]!.trim() === oldMember.trim())
      .map((match) => {
        const rawLine = match[0]!;
        const leading = rawLine.length - rawLine.trimStart().length;
        const trailing = rawLine.length - rawLine.trimEnd().length;
        const start = block.openEnd + match.index! + leading;
        return { start, end: block.openEnd + match.index! + rawLine.length - trailing, member: oldMember.trim() };
      });
  } catch {
    entries = findColonClassMembers(source, classId).filter((entry) => entry.member === oldMember.trim());
  }
  if (entries.length !== 1) throw new AmbiguousSourceMutationError('The class member is missing or ambiguous.');
  const entry = entries[0]!;
  return source.slice(0, entry.start) + newMember.trim() + source.slice(entry.end);
}

export function addClassMember(source: string, classId: string, member = '+operation(): void'): string {
  assertClassDiagram(source);
  if (!identifier.test(classId) || !member.trim() || /[\r\n{}]/.test(member)) {
    throw new AmbiguousSourceMutationError('The class member must be one supported member line.');
  }
  let block: ClassBlock;
  try { block = findClassBlock(source, classId); }
  catch {
    if (findColonClassMembers(source, classId).length) return appendLine(source, `${classId} : ${member.trim()}`);
    const declaration = new RegExp(`^([\\t ]*class[\\t ]+${escapePattern(classId)})[\\t ]*$`, 'gmu');
    const matches = [...source.matchAll(declaration)];
    if (matches.length !== 1) throw new AmbiguousSourceMutationError('The class declaration is missing or ambiguous.');
    const match = matches[0]!;
    const ending = lineEnding(source);
    const start = match.index!;
    const end = start + match[0].length;
    const indent = /^[\t ]*/.exec(match[0])![0];
    const replacement = `${match[1]} {${ending}${indent}  ${member.trim()}${ending}${indent}}`;
    return source.slice(0, start) + replacement + source.slice(end);
  }
  const ending = lineEnding(source);
  const beforeClose = source.slice(block.openEnd, block.closeStart);
  const indent = /^\s*/.exec(source.slice(block.closeStart))![0] + '  ';
  const addition = beforeClose.length > 0 && /(?:\r\n|\n|\r)$/.test(beforeClose)
    ? `${indent}${member.trim()}${ending}`
    : `${ending}${indent}${member.trim()}${ending}`;
  return source.slice(0, block.closeStart) + addition + source.slice(block.closeStart);
}

export type ClassStyleProperty = 'fill' | 'stroke';

function classStyleLine(source: string, id: string): { start: number; end: number; text: string } | undefined {
  const matches: Array<{ start: number; end: number; text: string }> = [];
  let offset = 0;
  for (const rawLine of source.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? []) {
    if (!rawLine) continue;
    const text = rawLine.replace(/[\r\n]+$/, '');
    if (new RegExp(`^\\s*style\\s+${escapePattern(id)}\\s+`).test(text)) matches.push({ start: offset, end: offset + text.length, text });
    offset += rawLine.length;
  }
  if (matches.length > 1) throw new AmbiguousSourceMutationError('The class has multiple style statements.');
  return matches[0];
}

export function getClassStyle(source: string, id: string, property: ClassStyleProperty): string {
  const line = classStyleLine(source, id);
  const value = line && new RegExp(`(?:^|,\\s*|\\s+)${property}\\s*:\\s*([^,]+)`).exec(line.text)?.[1];
  return value?.trim() ?? '';
}

export function setClassStyle(source: string, id: string, property: ClassStyleProperty, color: string): string {
  assertClassDiagram(source);
  if (!identifier.test(id)) throw new AmbiguousSourceMutationError('The class ID is invalid.');
  const normalized = color.trim();
  if (normalized && !/^(?:#[\da-f]{3,8}|[a-z]{1,24})$/i.test(normalized)) {
    throw new AmbiguousSourceMutationError('Class colors must be a CSS color name or hexadecimal color.');
  }
  const line = classStyleLine(source, id);
  if (!line) return normalized ? appendLine(source, `style ${id} ${property}:${normalized}`) : source;
  const propertyPattern = new RegExp(`(^|,\\s*|\\s+)${property}\\s*:\\s*[^,]+`);
  const match = propertyPattern.exec(line.text);
  if (!match) {
    if (!normalized) return source;
    const replacement = `${line.text},${property}:${normalized}`;
    return source.slice(0, line.start) + replacement + source.slice(line.end);
  }
  const replacement = normalized ? `${match[1]}${property}:${normalized}` : '';
  const updated = line.text.slice(0, match.index) + replacement + line.text.slice(match.index + match[0].length);
  if (/^\s*style\s+\S+\s*$/.test(updated)) {
    const [start, end] = lineRemovalSpan(source, line.start, line.end);
    return source.slice(0, start) + source.slice(end);
  }
  return source.slice(0, line.start) + updated + source.slice(line.end);
}
