import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';

export type FlowchartNodeShape = 'bare' | 'rect' | 'round' | 'diamond' | 'circle' | 'stadium' | 'subroutine' | 'database' | 'hexagon';

export interface FlowchartNode {
  id: string;
  label: string;
  shape: FlowchartNodeShape;
  lineStart: number;
  tokenStart: number;
  tokenEnd: number;
  declaration: boolean;
}

export interface FlowchartEdge {
  source: string;
  target: string;
  operator: string;
  label: string;
  lineStart: number;
  operatorStart: number;
  operatorEnd: number;
  syntaxEnd: number;
  labelStart?: number;
  labelEnd?: number;
  inlineLabel?: boolean;
  occurrence: number;
}

export interface FlowchartSubgraph {
  id: string;
  title: string;
  lineStart: number;
  lineEnd: number;
  indent: string;
}

interface Line {
  text: string;
  start: number;
  end: number;
  fullEnd: number;
}

interface NodeToken {
  id: string;
  label: string;
  shape: FlowchartNodeShape;
  start: number;
  end: number;
}

interface ParsedLine {
  nodes: NodeToken[];
  edges: Omit<FlowchartEdge, 'occurrence'>[];
  hasAmpersand: boolean;
}

const ID_CHAR = '[A-Za-z0-9_][\\w.-]*';
const EDGE_OPERATOR = '[<ox]?[-.=~]+[>xo]?';
const NODE_SHAPES: Array<[string, string, FlowchartNodeShape]> = [
  ['((', '))', 'circle'], ['([', '])', 'stadium'], ['[[', ']]', 'subroutine'],
  ['[(', ')]', 'database'], ['{{', '}}', 'hexagon'], ['[', ']', 'rect'], ['(', ')', 'round'], ['{', '}', 'diamond'],
];

function escapeRegExp(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function classSelectorEdits(line: Line, id: string, replacement: string): Array<{ start: number; end: number; text: string }> {
  const match = /^(\s*class\s+)(.*?)(\s+\S.*)$/i.exec(line.text);
  if (!match) return [];
  const selectors = match[2]!;
  const pattern = new RegExp(`(^|,)(\\s*)${escapeRegExp(id)}(?=,|$)`, 'g');
  const edits: Array<{ start: number; end: number; text: string }> = [];
  let token: RegExpExecArray | null;
  while ((token = pattern.exec(selectors)) !== null) {
    const start = line.start + match[1]!.length + token.index + token[1]!.length + token[2]!.length;
    edits.push({ start, end: start + id.length, text: replacement });
  }
  return edits;
}

function getLines(source: string): Line[] {
  const lines: Line[] = [];
  const matcher = /[^\r\n]*(?:\r\n|\n|\r|$)/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(source)) !== null) {
    if (!match[0]) break;
    const ending = /(?:\r\n|\n|\r)$/.exec(match[0])?.[0] ?? '';
    const text = match[0].slice(0, match[0].length - ending.length);
    lines.push({ text, start: match.index, end: match.index + text.length, fullEnd: match.index + match[0].length });
  }
  return lines;
}

function findClose(text: string, openAt: number, open: string, close: string): number {
  let quote = '';
  let escaped = false;
  let depth = 0;
  for (let index = openAt + open.length; index < text.length; index++) {
    const char = text[index]!;
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (quote) { if (char === quote) quote = ''; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (text.startsWith(open, index)) { depth++; index += open.length - 1; continue; }
    if (text.startsWith(close, index)) {
      if (depth === 0) return index;
      depth--;
      index += close.length - 1;
    }
  }
  return -1;
}

function parseEndpoint(text: string, cursor: number): NodeToken | undefined {
  const rest = text.slice(cursor);
  // Prefer actual shape delimiters, statement endings, and the longest complete
  // edge operator so punctuation in IDs is not mistaken for a link.
  const candidates: Array<NodeToken & { terminal: boolean; operatorLength: number }> = [];
  if (!/[A-Za-z0-9_]/.test(text[cursor] ?? '')) return undefined;
  let identifierEnd = cursor + 1;
  while (identifierEnd < text.length && /[\w.-]/.test(text[identifierEnd]!)) identifierEnd++;
  for (let length = 1; length <= identifierEnd - cursor; length++) {
    const id = rest.slice(0, length);
    let next = cursor + length;
    while (text[next] === ' ' || text[next] === '\t') next++;
    let tokenEnd = cursor + length;
    let label = '';
    let shape: FlowchartNodeShape = 'bare';
    const pair = NODE_SHAPES.find(([open]) => text.startsWith(open, next));
    if (pair) {
      const [open, close, kind] = pair;
      const closeAt = findClose(text, next, open, close);
      if (closeAt < 0) return undefined;
      label = text.slice(next + open.length, closeAt).replace(/^"([\s\S]*)"$/, '$1');
      shape = kind;
      next = closeAt + close.length;
      tokenEnd = next;
      while (text[next] === ' ' || text[next] === '\t') next++;
    }
    const operator = new RegExp(`^${EDGE_OPERATOR}`).exec(text.slice(next));
    const terminal = next === text.length || text[next] === ';' || text[next] === '&';
    if (terminal || operator) {
      candidates.push({ id, label, shape, start: cursor, end: tokenEnd, terminal, operatorLength: operator?.[0].length ?? 0 });
    }
  }
  if (!candidates.length) return undefined;
  candidates.sort((left, right) => Number(right.shape !== 'bare') - Number(left.shape !== 'bare')
    || Number(right.terminal) - Number(left.terminal)
    || right.operatorLength - left.operatorLength
    || right.id.length - left.id.length);
  return candidates[0];
}

function parseLine(line: Line): ParsedLine | undefined {
  const trimmed = line.text.trim();
  if (!trimmed || trimmed.startsWith('%%') || /^(?:flowchart|graph)\b/i.test(trimmed)
    || /^(?:subgraph|end|direction|classDef|style|class|click|linkStyle|accTitle|accDescr)\b/i.test(trimmed)
    || trimmed.startsWith('---') || trimmed.startsWith('%')) return undefined;
  const nodes: NodeToken[] = [];
  const edges: Omit<FlowchartEdge, 'occurrence'>[] = [];
  let cursor = line.text.search(/\S/);
  let endpoint = parseEndpoint(line.text, cursor);
  if (!endpoint) return undefined;
  nodes.push(endpoint);
  cursor = endpoint.end;
  let hasAmpersand = false;
  while (cursor < line.text.length) {
    while (line.text[cursor] === ' ' || line.text[cursor] === '\t') cursor++;
    if (cursor >= line.text.length || line.text[cursor] === ';') break;
    if (line.text[cursor] === '&') {
      hasAmpersand = true;
      cursor++;
      while (line.text[cursor] === ' ' || line.text[cursor] === '\t') cursor++;
      endpoint = parseEndpoint(line.text, cursor);
      if (!endpoint) return undefined;
      nodes.push(endpoint);
      cursor = endpoint.end;
      continue;
    }
    const operatorMatch = new RegExp(`^${EDGE_OPERATOR}`).exec(line.text.slice(cursor));
    if (!operatorMatch) return undefined;
    const operatorStart = cursor;
    cursor += operatorMatch[0].length;
    let operator = operatorMatch[0];
    let operatorEnd = cursor;
    let syntaxEnd = cursor;
    while (line.text[cursor] === ' ' || line.text[cursor] === '\t') cursor++;
    let label = '';
    let labelStart: number | undefined;
    let labelEnd: number | undefined;
    let inlineLabel = false;
    if (line.text[cursor] === '|') {
      const pipeEnd = line.text.indexOf('|', cursor + 1);
      if (pipeEnd < 0) return undefined;
      label = line.text.slice(cursor + 1, pipeEnd);
      labelStart = cursor;
      labelEnd = pipeEnd + 1;
      cursor = pipeEnd + 1;
      while (line.text[cursor] === ' ' || line.text[cursor] === '\t') cursor++;
    } else if (['--', '==', '-.'].includes(operator)) {
      const labeled = new RegExp(`^(.+?)([ \\t]+)(${EDGE_OPERATOR})([ \\t]+)`).exec(line.text.slice(cursor));
      if (labeled && labeled[1]!.trim() && parseEndpoint(line.text, cursor + labeled[0].length)) {
        label = labeled[1]!.trim();
        operator = labeled[3]!;
        inlineLabel = true;
        syntaxEnd = cursor + labeled[0].length - labeled[4]!.length;
        operatorEnd = syntaxEnd;
        labelStart = cursor;
        labelEnd = cursor + labeled[1]!.length;
        cursor += labeled[0].length;
      }
    }
    if (!inlineLabel) syntaxEnd = operatorEnd;
    endpoint = parseEndpoint(line.text, cursor);
    if (!endpoint) return undefined;
    const prior = nodes[nodes.length - 1]!;
    nodes.push(endpoint);
    edges.push({ source: prior.id, target: endpoint.id, operator, label,
      lineStart: line.start, operatorStart: line.start + operatorStart, operatorEnd: line.start + operatorEnd,
      syntaxEnd: line.start + syntaxEnd,
      ...(labelStart === undefined ? {} : { labelStart: line.start + labelStart }),
      ...(labelEnd === undefined ? {} : { labelEnd: line.start + labelEnd }), inlineLabel });
    cursor = endpoint.end;
  }
  if (cursor < line.text.length && line.text.slice(cursor).trim() && line.text.slice(cursor).trim() !== ';') return undefined;
  return { nodes, edges, hasAmpersand };
}

function isDeclarationLine(line: Line): NodeToken | undefined {
  const trimmed = line.text.trim();
  if (!trimmed || trimmed.startsWith('%%') || /^(?:flowchart|graph|subgraph|end|direction|style|class|classDef|click|linkStyle)\b/i.test(trimmed)) return undefined;
  const leading = line.text.length - line.text.trimStart().length;
  const token = parseEndpoint(line.text, leading);
  if (!token || !['', ';'].includes(line.text.slice(token.end).trim())) return undefined;
  return token;
}

function parseDocument(source: string): { lines: Line[]; nodes: FlowchartNode[]; edges: FlowchartEdge[]; supported: boolean } {
  const lines = getLines(source);
  const nodeMap = new Map<string, FlowchartNode>();
  const edges: FlowchartEdge[] = [];
  const edgeOccurrences = new Map<string, number>();
  let supported = true;
  for (const line of lines) {
    const decl = isDeclarationLine(line);
    if (decl) {
      const existing = nodeMap.get(decl.id);
      if (existing && existing.declaration) supported = false;
      nodeMap.set(decl.id, { ...decl, lineStart: line.start, tokenStart: line.start + decl.start,
        tokenEnd: line.start + decl.end, declaration: true });
      continue;
    }
    const parsed = parseLine(line);
    if (!parsed) {
      if (/(?:--|==|-.|<[-.=~]|[|&])/.test(line.text) && !line.text.trim().startsWith('%%')) supported = false;
      continue;
    }
    for (const token of parsed.nodes) {
      const prior = nodeMap.get(token.id);
      if (!prior || token.shape !== 'bare') {
        nodeMap.set(token.id, { ...token, lineStart: line.start, tokenStart: line.start + token.start,
          tokenEnd: line.start + token.end, declaration: prior?.declaration ?? false });
      }
    }
    if (parsed.hasAmpersand) supported = false;
    for (const edge of parsed.edges) {
      const pair = JSON.stringify([edge.source, edge.target]);
      const occurrence = edgeOccurrences.get(pair) ?? 0;
      edgeOccurrences.set(pair, occurrence + 1);
      edges.push({ ...edge, occurrence });
    }
  }
  return { lines, nodes: [...nodeMap.values()], edges, supported };
}

export function listFlowchartNodes(source: string): FlowchartNode[] {
  return parseDocument(source).nodes.sort((a, b) => a.id.localeCompare(b.id));
}

export function listFlowchartEdges(source: string): FlowchartEdge[] {
  return parseDocument(source).edges;
}

export function isFlowchartEdgeIndexingSafe(source: string): boolean {
  const parsed = parseDocument(source);
  return parsed.supported && parsed.lines.every((line) => {
    if (!/^\s*linkStyle\b/i.test(line.text)) return true;
    const selector = /^\s*linkStyle\s+(\S+)/i.exec(line.text)?.[1];
    return selector?.toLowerCase() === 'default' || /^\d+$/.test(selector ?? '');
  });
}

export function listFlowchartSubgraphs(source: string): FlowchartSubgraph[] {
  const lines = getLines(source);
  const stack: FlowchartSubgraph[] = [];
  const result: FlowchartSubgraph[] = [];
  const idPattern = new RegExp(`^subgraph\\s+(${ID_CHAR})(?:\\s*\\[([^\\]]*)\\])?\\s*$`, 'i');
  for (const line of lines) {
    const start = /^(\s*)subgraph\s+(.+?)\s*$/i.exec(line.text);
    if (start) {
      const explicit = idPattern.exec(line.text.trim());
      if (!explicit) { stack.push({ id: '', title: '', lineStart: line.start, lineEnd: line.fullEnd, indent: start[1]! }); continue; }
      const title = (explicit[2] ?? explicit[1]!).replace(/^"(.*)"$/, '$1');
      stack.push({ id: explicit[1]!, title, lineStart: line.start, lineEnd: line.fullEnd, indent: start[1]! });
    } else if (/^\s*end\s*;?\s*$/i.test(line.text)) {
      const graph = stack.pop();
      if (graph?.id) { graph.lineEnd = line.fullEnd; result.push(graph); }
    }
  }
  return result.sort((a, b) => a.lineStart - b.lineStart);
}

function replaceSpans(source: string, edits: Array<{ start: number; end: number; text: string }>): string {
  let result = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  return result;
}

function preferredEnding(source: string): string { return /\r\n|\n|\r/.exec(source)?.[0] ?? '\n'; }

function appendLines(source: string, additions: string[]): string {
  return appendSourceLines(source, additions, 'flowchart');
}

function insertLinesInSubgraph(source: string, id: string, additions: string[]): string {
  const matches = listFlowchartSubgraphs(source).filter((graph) => graph.id === id);
  if (matches.length !== 1) throw new AmbiguousSourceMutationError(`Subgraph ${id} could not be located safely.`);
  const graph = matches[0]!;
  const lines = getLines(source);
  const close = lines.find((line) => line.fullEnd === graph.lineEnd && /^\s*end\s*;?\s*$/i.test(line.text));
  if (!close) throw new AmbiguousSourceMutationError(`Subgraph ${id} closing end could not be located safely.`);
  const eol = preferredEnding(source);
  const indent = `${graph.indent}    `;
  const insertion = additions.map((line) => `${indent}${line}`).join(eol) + eol;
  return source.slice(0, close.start) + insertion + source.slice(close.start);
}

function quoteLabel(label: string): string {
  return /^end$/i.test(label) || /[\x5B\x5D{}()|<>\r\n"\s]/.test(label)
    ? `"${label.replaceAll('"', '#quot;').replace(/[\r\n]+/g, '<br/>')}"`
    : label;
}

function shapeToken(shape: FlowchartNodeShape, label: string): string {
  const value = quoteLabel(label);
  if (shape === 'round') return `(${value})`;
  if (shape === 'diamond') return `{${value}}`;
  if (shape === 'circle') return `((${value}))`;
  if (shape === 'stadium') return `([${value}])`;
  if (shape === 'subroutine') return `[[${value}]]`;
  if (shape === 'database') return `[(${value})]`;
  if (shape === 'hexagon') return `{{${value}}}`;
  if (shape === 'rect') return `[${value}]`;
  return '';
}

function validateEdgeLabel(label: string): void {
  if (/[|\r\n]/.test(label)) throw new AmbiguousSourceMutationError('Edge labels cannot contain pipes or line breaks.');
}

export function addFlowchartNode(source: string, id: string, label: string, shape: FlowchartNodeShape = 'rect'): string {
  if (!/^[A-Za-z0-9_][\w.-]*$/.test(id)) throw new AmbiguousSourceMutationError('Node ID is not supported.');
  if (listFlowchartNodes(source).some((node) => node.id === id) || listFlowchartSubgraphs(source).some((graph) => graph.id === id)) {
    throw new AmbiguousSourceMutationError(`Diagram ID ${id} already exists.`);
  }
  return appendLines(source, [`${id}${shapeToken(shape, label)}`]);
}

export function addFlowchartNodeToSubgraph(source: string, subgraphId: string, id: string, label: string, shape: FlowchartNodeShape = 'rect'): string {
  if (!/^[A-Za-z0-9_][\w.-]*$/.test(id)) throw new AmbiguousSourceMutationError('Node ID is not supported.');
  if (listFlowchartNodes(source).some((node) => node.id === id) || listFlowchartSubgraphs(source).some((graph) => graph.id === id)) {
    throw new AmbiguousSourceMutationError(`Diagram ID ${id} already exists.`);
  }
  return insertLinesInSubgraph(source, subgraphId, [`${id}${shapeToken(shape, label)}`]);
}

export function addFlowchartEdgeToSubgraph(source: string, subgraphId: string, from: string, to: string, operator = '-->', label = ''): string {
  if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Edge syntax cannot be indexed safely.');
  const knownNodes = new Set(listFlowchartNodes(source).map((node) => node.id));
  if (!knownNodes.has(from) || !knownNodes.has(to)) throw new AmbiguousSourceMutationError('Both edge endpoints must exist.');
  if (!new RegExp(`^${EDGE_OPERATOR}$`).test(operator)) throw new AmbiguousSourceMutationError('Edge operator is not supported.');
  validateEdgeLabel(label);
  return insertLinesInSubgraph(source, subgraphId, [`${from} ${operator}${label ? `|${label}|` : ''} ${to}`]);
}

export function setFlowchartNode(source: string, id: string, update: { id?: string; label?: string; shape?: FlowchartNodeShape }): string {
  const parsed = parseDocument(source);
  const node = parsed.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new AmbiguousSourceMutationError(`Node ${id} could not be located safely.`);
  const nextId = update.id ?? id;
  if (!/^[A-Za-z0-9_][\w.-]*$/.test(nextId)) throw new AmbiguousSourceMutationError('Node ID is not supported.');
  if (update.shape === 'bare' && update.label) throw new AmbiguousSourceMutationError('Bare nodes cannot have a separate label.');
  if (nextId !== id && (parsed.nodes.some((candidate) => candidate.id === nextId)
    || listFlowchartSubgraphs(source).some((graph) => graph.id === nextId))) {
    throw new AmbiguousSourceMutationError(`Diagram ID ${nextId} already exists.`);
  }
  if (nextId !== id && !parsed.supported) throw new AmbiguousSourceMutationError('Node references include edge syntax that cannot be indexed safely.');
  const declarations: Array<{ start: number; end: number; label: string; shape: FlowchartNodeShape }> = [];
  const references: Array<{ start: number; end: number; label: string; shape: FlowchartNodeShape }> = [];
  for (const line of parsed.lines) {
    const decl = isDeclarationLine(line);
    if (decl?.id === id) declarations.push({ start: line.start + decl.start, end: line.start + decl.end, label: decl.label, shape: decl.shape });
    const row = decl ? undefined : parseLine(line);
    if (row) for (const token of row.nodes) if (token.id === id) references.push({ start: line.start + token.start, end: line.start + token.end, label: token.label, shape: token.shape });
    const trimmed = line.text.trim();
    if (/^(?:style|class|click)\b/i.test(trimmed) && new RegExp(`(?:^|\\s)${escapeRegExp(id)}(?:\\s|$)`).test(trimmed)) {
      if (/^(?:click)\b/i.test(trimmed)) throw new AmbiguousSourceMutationError('Node has an opaque click reference.');
    }
  }
  if (declarations.length > 1 || (declarations.length === 0 && references.length === 0)) {
    throw new AmbiguousSourceMutationError('Node definition is missing or occurs more than once, so the edit is ambiguous.');
  }
  const definitions = [...declarations, ...references.filter((reference) => reference.shape !== 'bare')];
  const needsPresentationChange = update.label !== undefined || update.shape !== undefined;
  const affected = needsPresentationChange
    ? definitions.length ? definitions : [declarations[0] ?? references[references.length - 1]!]
    : [];
  const label = update.label ?? node.label;
  const shape = update.shape ?? (node.shape === 'bare' && update.label ? 'rect' : node.shape);
  const edits: Array<{ start: number; end: number; text: string }> = affected.map((definition) => ({
    start: definition.start,
    end: definition.end,
    text: `${nextId}${shapeToken(shape, label)}`,
  }));
  const affectedSpans = new Set(affected.map(({ start }) => start));
  if (nextId !== id) {
    for (const declaration of declarations) {
      if (!affectedSpans.has(declaration.start)) edits.push({ start: declaration.start, end: declaration.end, text: nextId + shapeToken(declaration.shape, declaration.label) });
    }
    for (const line of parsed.lines) {
      const row = parseLine(line);
      if (row) for (const token of row.nodes) if (token.id === id && !affectedSpans.has(line.start + token.start)) {
        edits.push({ start: line.start + token.start, end: line.start + token.end, text: nextId + shapeToken(token.shape, token.label) });
      }
      const style = new RegExp(`^(\\s*style\\s+)(${ID_CHAR})(\\b.*)$`, 'i').exec(line.text);
      if (style?.[2] === id) {
        const offset = line.start + style[1]!.length;
        edits.push({ start: offset, end: offset + id.length, text: nextId });
      }
      edits.push(...classSelectorEdits(line, id, nextId));
    }
  }
  return replaceSpans(source, edits);
}

export function addFlowchartEdge(source: string, from: string, to: string, operator = '-->', label = ''): string {
  if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Edge syntax cannot be indexed safely.');
  const knownNodes = new Set(listFlowchartNodes(source).map((node) => node.id));
  if (!knownNodes.has(from) || !knownNodes.has(to)) {
    throw new AmbiguousSourceMutationError('Both edge endpoints must exist.');
  }
  if (!new RegExp(`^${EDGE_OPERATOR}$`).test(operator)) throw new AmbiguousSourceMutationError('Edge operator is not supported.');
  validateEdgeLabel(label);
  return appendLines(source, [`${from} ${operator}${label ? `|${label}|` : ''} ${to}`]);
}

export function setFlowchartEdge(source: string, edge: FlowchartEdge, update: { source?: string; target?: string; operator?: string; label?: string }): string {
  if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Edge syntax cannot be indexed safely.');
  const current = listFlowchartEdges(source).find((candidate) => candidate.lineStart === edge.lineStart
    && candidate.operatorStart === edge.operatorStart && candidate.source === edge.source && candidate.target === edge.target);
  if (!current) throw new AmbiguousSourceMutationError('The edge statement changed or cannot be located safely.');
  const knownNodes = new Set(listFlowchartNodes(source).map((node) => node.id));
  if ((update.source !== undefined && !knownNodes.has(update.source)) || (update.target !== undefined && !knownNodes.has(update.target))) {
    throw new AmbiguousSourceMutationError('Reconnected edge endpoints must already exist.');
  }
  const operator = update.operator ?? current.operator;
  if (!new RegExp(`^${EDGE_OPERATOR}$`).test(operator)) throw new AmbiguousSourceMutationError('Edge operator is not supported.');
  if (update.label !== undefined) validateEdgeLabel(update.label);
  const line = getLines(source).find((item) => item.start === current.lineStart)!;
  const parsedLine = parseLine(line);
  const edgeIndex = parsedLine?.edges.findIndex((candidate) => candidate.operatorStart === current.operatorStart) ?? -1;
  const endpoint = parsedLine?.nodes[edgeIndex];
  const target = parsedLine?.nodes[edgeIndex + 1];
  if (!endpoint || !target) throw new AmbiguousSourceMutationError('The edge endpoints cannot be located safely.');
  const edits: Array<{ start: number; end: number; text: string }> = [];
  if (current.inlineLabel && (update.label !== undefined || update.operator !== undefined)) {
    const label = update.label ?? current.label;
    edits.push({ start: current.operatorStart, end: current.syntaxEnd, text: `${operator}${label ? `|${label}|` : ''}` });
  } else if (update.operator !== undefined) {
    edits.push({ start: current.operatorStart, end: current.operatorEnd, text: operator });
  }
  if (update.source !== undefined) edits.push({ start: line.start + endpoint.start, end: line.start + endpoint.start + current.source.length, text: update.source });
  if (update.target !== undefined) edits.push({ start: line.start + target.start, end: line.start + target.start + current.target.length, text: update.target });
  if (update.label !== undefined && !current.inlineLabel) {
    if (current.labelStart !== undefined && current.labelEnd !== undefined) {
      edits.push({ start: current.labelStart, end: current.labelEnd, text: update.label ? `|${update.label}|` : '' });
    } else if (update.label) {
      edits.push({ start: current.operatorEnd, end: current.operatorEnd, text: `|${update.label}|` });
    }
  }
  return replaceSpans(source, edits);
}

export function deleteFlowchartEdge(source: string, edge: FlowchartEdge): string {
  if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Edge syntax cannot be indexed safely.');
  const edges = listFlowchartEdges(source);
  const current = edges.find((candidate) => candidate.lineStart === edge.lineStart && candidate.operatorStart === edge.operatorStart);
  if (!current) throw new AmbiguousSourceMutationError('The edge statement changed or cannot be located safely.');
  const line = getLines(source).find((item) => item.start === current.lineStart)!;
  const parsedLine = parseLine(line);
  if (!parsedLine || parsedLine.hasAmpersand || parsedLine.edges.length !== 1) {
    throw new AmbiguousSourceMutationError('Deleting part of a chained edge statement is not supported.');
  }
  const removedIndex = edges.indexOf(current);
  const parsed = parseDocument(source);
  const explicitNodes = new Set(parsed.nodes.filter((node) => node.declaration).map((node) => node.id));
  const remainingEdges = edges.filter((candidate) => candidate.lineStart !== line.start);
  const remainingRefs = new Set(remainingEdges.flatMap((candidate) => [candidate.source, candidate.target]));
  const indent = /^\s*/.exec(line.text)?.[0] ?? '';
  const keptNodes = parsedLine.nodes.filter((node, index, all) => all.findIndex((candidate) => candidate.id === node.id) === index)
    .filter((node) => !explicitNodes.has(node.id) && (node.shape !== 'bare' || !remainingRefs.has(node.id)))
    .map((node) => `${indent}${node.id}${shapeToken(node.shape, node.label)}`);
  const ending = source.slice(line.end, line.fullEnd);
  let result = source.slice(0, line.start) + keptNodes.join(ending || preferredEnding(source)) + (keptNodes.length ? ending : '') + source.slice(line.fullEnd);
  if (!keptNodes.length && line.fullEnd === source.length && line.end === line.fullEnd && line.start > 0) {
    const previousEnding = /(?:\r\n|\n|\r)$/.exec(source.slice(0, line.start))?.[0];
    if (previousEnding) result = result.slice(0, line.start - previousEnding.length) + result.slice(line.start);
  }
  if (/^\s*linkStyle\b/im.test(source)) result = reindexLinkStyles(result, [removedIndex]);
  return result;
}

function reindexLinkStyles(source: string, removedIndices: number[] = []): string {
  const lines = getLines(source);
  const edgeCount = lines.reduce((count, line) => count + (parseLine(line)?.edges.length ?? 0), 0);
  const removals: Array<{ start: number; end: number; text: string }> = [];
  for (const line of lines) {
    const match = /^(\s*linkStyle\s+)(\d+)(\s+.*)$/i.exec(line.text);
    if (!match) continue;
    const oldIndex = Number(match[2]);
    const removedBefore = removedIndices.filter((index) => index < oldIndex).length;
    if (removedIndices.includes(oldIndex)) removals.push({ start: line.start, end: line.fullEnd, text: '' });
    else if (oldIndex >= edgeCount + removedIndices.length) removals.push({ start: line.start, end: line.fullEnd, text: '' });
    else if (oldIndex >= 0 && edgeCount) {
      const mapped = oldIndex - removedBefore;
      removals.push({ start: line.start, end: line.start + match[0].length, text: `${match[1]}${mapped}${match[3]}` });
    }
  }
  return replaceSpans(source, removals);
}

export function deleteFlowchartNode(source: string, id: string): string {
  const parsed = parseDocument(source);
  const node = parsed.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new AmbiguousSourceMutationError(`Node ${id} could not be located safely.`);
  if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Node participates in edge syntax that cannot be indexed safely.');
  const remove = new Set<number>();
  const removedEdgeIndices: number[] = [];
  const candidateNodes = new Map<string, { node: NodeToken; line: Line }>();
  let edgeIndex = 0;
  for (const line of parsed.lines) {
    const decl = isDeclarationLine(line);
    if (decl?.id === id) remove.add(line.start);
    const row = parseLine(line);
    if (row?.nodes.some((token) => token.id === id) && row.edges.length) {
      remove.add(line.start);
      removedEdgeIndices.push(...row.edges.map((_, index) => edgeIndex + index));
      for (const token of row.nodes) if (token.id !== id && !candidateNodes.has(token.id)) candidateNodes.set(token.id, { node: token, line });
    }
    edgeIndex += row?.edges.length ?? 0;
    if (/^\s*style\s+/.test(line.text) && new RegExp(`^\\s*style\\s+${escapeRegExp(id)}(?:\\s|$)`).test(line.text)) remove.add(line.start);
    if (/^\s*click\s+/i.test(line.text) && new RegExp(`(?:^|\\s)${escapeRegExp(id)}(?:\\s|$)`).test(line.text)) {
      throw new AmbiguousSourceMutationError('Node has an opaque click reference.');
    }
    const classEdits = classSelectorEdits(line, id, '');
    if (classEdits.length) {
      const directive = /^\s*class\s+([^\s]+)\s+\S/.exec(line.text);
      if (directive?.[1]?.includes(',')) throw new AmbiguousSourceMutationError('Node shares a class directive with other nodes.');
      remove.add(line.start);
    }
  }
  const removedLines = parsed.lines.filter((line) => remove.has(line.start));
  const remainingReferences = new Set(parsed.edges.filter((edge) => !remove.has(edge.lineStart))
    .flatMap((edge) => [edge.source, edge.target]));
  const remainingDeclarations = new Set(parsed.lines.filter((line) => !remove.has(line.start))
    .map(isDeclarationLine).filter((declaration): declaration is NodeToken => Boolean(declaration)).map(({ id: nodeId }) => nodeId));
  const preservedByLine = new Map<number, string[]>();
  for (const [nodeId, { node, line }] of candidateNodes) {
    if (remainingReferences.has(nodeId) || remainingDeclarations.has(nodeId)) continue;
    const declarations = preservedByLine.get(line.start) ?? [];
    const indent = /^\s*/.exec(line.text)?.[0] ?? '';
    declarations.push(`${indent}${nodeId}${shapeToken(node.shape, node.label)}`);
    preservedByLine.set(line.start, declarations);
  }
  const edits = removedLines.map((line) => {
    const ending = source.slice(line.end, line.fullEnd);
    const replacement = (preservedByLine.get(line.start) ?? []).join(ending || preferredEnding(source));
    return { start: line.start, end: line.fullEnd, text: replacement + (replacement ? ending : '') };
  });
  const lastRemoved = [...parsed.lines].reverse().find((line) => remove.has(line.start));
  let next = replaceSpans(source, edits);
  if (lastRemoved && lastRemoved.fullEnd === source.length && lastRemoved.end === lastRemoved.fullEnd && lastRemoved.start > 0) {
    const previousEnding = /(?:\r\n|\n|\r)$/.exec(source.slice(0, lastRemoved.start))?.[0];
    if (previousEnding) next = next.slice(0, lastRemoved.start - previousEnding.length) + next.slice(lastRemoved.start);
  }
  return /^\s*linkStyle\b/im.test(next) ? reindexLinkStyles(next, removedEdgeIndices) : next;
}

export function setFlowchartNodeStyle(source: string, id: string, property: 'fill' | 'stroke' | 'stroke-dasharray', value: string): string {
  if (!listFlowchartNodes(source).some((node) => node.id === id)) throw new AmbiguousSourceMutationError(`Node ${id} could not be located safely.`);
  return setStyleDeclaration(source, id, property, value);
}

function setStyleDeclaration(source: string, id: string, property: 'fill' | 'stroke' | 'stroke-dasharray', value: string): string {
  const lines = getLines(source);
  const existing = lines.filter((line) => new RegExp(`^\\s*style\\s+${escapeRegExp(id)}(?:\\s|$)`).test(line.text));
  if (existing.length > 1) throw new AmbiguousSourceMutationError('Node has multiple style declarations.');
  if (property === 'stroke-dasharray') {
    if (!['', '0', '6 4', '2 3'].includes(value)) throw new AmbiguousSourceMutationError('Border line style is not supported.');
  } else validateStyleColor(value);
  if (!existing.length) return value ? appendLines(source, [`style ${id} ${property}:${value}`]) : source;
  const line = existing[0]!;
  const match = /^(\s*style\s+\S+\s+)(.*)$/.exec(line.text)!;
  const props = new Map(match[2]!.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf(':'); return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }));
  if (value) props.set(property, value);
  else props.delete(property);
  if (!props.size) return source.slice(0, line.start) + source.slice(line.fullEnd);
  return source.slice(0, line.start) + `${match[1]}${[...props].map(([key, val]) => `${key}:${val}`).join(',')}` + source.slice(line.end);
}

function validateStyleColor(value: string): void {
  if (!/^#[\da-f]{3,8}$/i.test(value) && !/^[a-z]+$/i.test(value)) throw new AmbiguousSourceMutationError('Style color is not supported.');
}

export function getFlowchartElementStyle(source: string, id: string, property: 'fill' | 'stroke' | 'stroke-dasharray'): string {
  const matches = getLines(source).filter((line) => new RegExp(`^\\s*style\\s+${escapeRegExp(id)}(?:\\s|$)`).test(line.text));
  if (matches.length !== 1) return '';
  const body = /^\s*style\s+\S+\s+(.*)$/.exec(matches[0]!.text)?.[1] ?? '';
  return body.split(',').map((item) => item.trim()).map((item) => item.split(':', 2))
    .find(([name]) => name === property)?.[1]?.trim() ?? '';
}

export interface FlowchartStyleIndex {
  readonly elements: ReadonlyMap<string, Readonly<Record<string, string>>>;
  readonly edges: ReadonlyMap<number, string>;
}

export function getFlowchartStyleIndex(source: string): FlowchartStyleIndex {
  const elements = new Map<string, Readonly<Record<string, string>>>();
  const duplicateElements = new Set<string>();
  const edges = new Map<number, string>();

  for (const line of getLines(source)) {
    const style = /^\s*style\s+(\S+)\s+(.*)$/.exec(line.text);
    if (style) {
      const id = style[1]!;
      if (elements.has(id)) {
        elements.delete(id);
        duplicateElements.add(id);
      } else if (!duplicateElements.has(id)) {
        elements.set(id, Object.fromEntries(style[2]!.split(',').map((part) => part.trim()).filter(Boolean).map((part) => {
          const colon = part.indexOf(':');
          return colon < 0 ? [part, ''] : [part.slice(0, colon).trim(), part.slice(colon + 1).trim()];
        })));
      }
      continue;
    }

    const linkStyle = /^\s*linkStyle\s+(\d+)\s+(.*)$/.exec(line.text);
    if (linkStyle) {
      const index = Number(linkStyle[1]);
      if (!edges.has(index)) {
        const stroke = linkStyle[2]!.split(',').map((part) => part.trim()).map((part) => part.split(':', 2))
          .find(([name]) => name === 'stroke')?.[1]?.trim();
        if (stroke !== undefined) edges.set(index, stroke);
      }
    }
  }

  return { elements, edges };
}

export function getFlowchartEdgeStyle(source: string, edge: FlowchartEdge, property: 'stroke'): string {
  const edges = listFlowchartEdges(source);
  const index = edges.findIndex((candidate) => candidate.lineStart === edge.lineStart && candidate.operatorStart === edge.operatorStart);
  if (index < 0) return '';
  const match = getLines(source).find((line) => new RegExp(`^\\s*linkStyle\\s+${index}(?:\\s|$)`).test(line.text));
  const body = match && /^\s*linkStyle\s+\d+\s+(.*)$/.exec(match.text)?.[1];
  return body?.split(',').map((item) => item.trim()).map((item) => item.split(':', 2))
    .find(([name]) => name === property)?.[1]?.trim() ?? '';
}

export function setFlowchartEdgeStyle(source: string, edge: FlowchartEdge, value: string): string {
  if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Edge syntax cannot be indexed safely.');
  if (value) validateStyleColor(value);
  const edges = listFlowchartEdges(source);
  const index = edges.findIndex((candidate) => candidate.lineStart === edge.lineStart && candidate.operatorStart === edge.operatorStart);
  if (index < 0) throw new AmbiguousSourceMutationError('The edge statement changed or cannot be located safely.');
  const lines = getLines(source);
  const existing = lines.find((line) => new RegExp(`^\\s*linkStyle\\s+${index}(?:\\s|$)`).test(line.text));
  if (!existing) return value ? appendLines(source, [`linkStyle ${index} stroke:${value}`]) : source;
  const match = /^(\s*linkStyle\s+\d+\s+)(.*)$/.exec(existing.text);
  if (!match) throw new AmbiguousSourceMutationError('The edge style cannot be located safely.');
  const properties = match[2]!.split(',').map((part) => part.trim()).filter(Boolean);
  const nextProperties: string[] = [];
  let foundStroke = false;
  for (const property of properties) {
    if (!/^stroke\s*:/i.test(property)) {
      nextProperties.push(property);
      continue;
    }
    if (value && !foundStroke) nextProperties.push(`stroke:${value}`);
    foundStroke = true;
  }
  if (value && !foundStroke) nextProperties.push(`stroke:${value}`);
  if (!nextProperties.length) return source.slice(0, existing.start) + source.slice(existing.fullEnd);
  const updated = `${match[1]}${nextProperties.join(',')}`;
  return source.slice(0, existing.start) + updated + source.slice(existing.end);
}

export function setFlowchartSubgraph(source: string, id: string, update: { id?: string; title?: string; fill?: string; stroke?: string; borderType?: 'default' | 'solid' | 'dashed' | 'dotted' }): string {
  const graph = listFlowchartSubgraphs(source).find((candidate) => candidate.id === id);
  if (!graph) throw new AmbiguousSourceMutationError(`Subgraph ${id} could not be located safely.`);
  const nextId = update.id ?? id;
  if (!/^[A-Za-z0-9_][\w.-]*$/.test(nextId)) throw new AmbiguousSourceMutationError('Subgraph ID is not supported.');
  if (nextId !== id && (listFlowchartSubgraphs(source).some((candidate) => candidate.id === nextId)
    || listFlowchartNodes(source).some((node) => node.id === nextId))) {
    throw new AmbiguousSourceMutationError(`Diagram ID ${nextId} already exists.`);
  }
  const lines = getLines(source);
  const header = lines.find((line) => line.start === graph.lineStart)!;
  const title = update.title ?? graph.title;
  const headerText = `${graph.indent}subgraph ${nextId}${title && title !== nextId ? `[${quoteLabel(title)}]` : ''}`;
  const edits = [{ start: header.start, end: header.end, text: headerText }];
  if (nextId !== id) {
    if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Subgraph references include unsupported edge syntax.');
    for (const line of lines) {
      const row = parseLine(line);
      if (row) for (const token of row.nodes) if (token.id === id) {
        edits.push({ start: line.start + token.start, end: line.start + token.start + id.length, text: nextId });
      }
      const reference = new RegExp(`^(\\s*style\\s+)${escapeRegExp(id)}(\\b.*)$`, 'i').exec(line.text);
      if (reference) {
        const offset = line.start + reference[1]!.length;
        edits.push({ start: offset, end: offset + id.length, text: nextId });
      }
      edits.push(...classSelectorEdits(line, id, nextId));
      if (/^\s*click\s+/i.test(line.text) && new RegExp(`(?:^|\\s)${escapeRegExp(id)}(?:\\s|$)`).test(line.text)) {
        throw new AmbiguousSourceMutationError('Subgraph has an opaque click reference.');
      }
    }
  }
  let result = replaceSpans(source, edits);
  if (update.fill !== undefined) result = setStyleDeclaration(result, nextId, 'fill', update.fill);
  if (update.stroke !== undefined) result = setStyleDeclaration(result, nextId, 'stroke', update.stroke);
  if (update.borderType !== undefined) result = setStyleDeclaration(result, nextId, 'stroke-dasharray', {
    default: '', solid: '0', dashed: '6 4', dotted: '2 3',
  }[update.borderType]);
  return result;
}

export function addFlowchartSubgraph(source: string, id: string, title: string): string {
  if (!/^[A-Za-z0-9_][\w.-]*$/.test(id)) throw new AmbiguousSourceMutationError('Subgraph ID is not supported.');
  if (listFlowchartSubgraphs(source).some((graph) => graph.id === id) || listFlowchartNodes(source).some((node) => node.id === id)) {
    throw new AmbiguousSourceMutationError(`Diagram ID ${id} already exists.`);
  }
  const nodeId = freshNodeId(source, `${id}_node`);
  return appendLines(source, [`subgraph ${id}[${quoteLabel(title)}]`, `    ${nodeId}[${quoteLabel(title)}]`, 'end']);
}

export function addFlowchartSubgraphToSubgraph(source: string, parentId: string, id: string, title: string): string {
  if (!/^[A-Za-z0-9_][\w.-]*$/.test(id)) throw new AmbiguousSourceMutationError('Subgraph ID is not supported.');
  if (listFlowchartSubgraphs(source).some((graph) => graph.id === id) || listFlowchartNodes(source).some((node) => node.id === id)) {
    throw new AmbiguousSourceMutationError(`Diagram ID ${id} already exists.`);
  }
  const nodeId = freshNodeId(source, `${id}_node`);
  return insertLinesInSubgraph(source, parentId, [
    `subgraph ${id}[${quoteLabel(title)}]`,
    `    ${nodeId}[${quoteLabel(title)}]`,
    'end',
  ]);
}

export function flowchartSubgraphAt(source: string, offset: number): FlowchartSubgraph | undefined {
  return listFlowchartSubgraphs(source)
    .filter((graph) => offset > graph.lineStart && offset < graph.lineEnd)
    .sort((left, right) => left.lineEnd - left.lineStart - (right.lineEnd - right.lineStart))[0];
}

function freshNodeId(source: string, prefix: string): string {
  const used = new Set([
    ...listFlowchartNodes(source).map((node) => node.id),
    ...listFlowchartSubgraphs(source).map((graph) => graph.id),
  ]);
  let id = prefix;
  let suffix = 2;
  while (used.has(id)) id = `${prefix}${suffix++}`;
  return id;
}

export function deleteFlowchartSubgraph(source: string, id: string): string {
  const graph = listFlowchartSubgraphs(source).find((candidate) => candidate.id === id);
  if (!graph) throw new AmbiguousSourceMutationError(`Subgraph ${id} could not be located safely.`);
  const parsed = parseDocument(source);
  if (!isFlowchartEdgeIndexingSafe(source)) throw new AmbiguousSourceMutationError('Subgraph references include unsupported edge syntax.');
  const lineInGraph = (line: Line): boolean => line.start >= graph.lineStart && line.fullEnd <= graph.lineEnd;
  const innerIds = new Set<string>();
  for (const line of parsed.lines) {
    if (!lineInGraph(line)) continue;
    const declaration = isDeclarationLine(line);
    if (declaration) innerIds.add(declaration.id);
    for (const node of parseLine(line)?.nodes ?? []) innerIds.add(node.id);
  }
  const removedIds = new Set(innerIds);
  removedIds.add(id);
  const removeLines = new Set<number>([graph.lineStart]);
  const removedEdgeIndices: number[] = [];
  const candidateNodes = new Map<string, { node: NodeToken; line: Line }>();
  let edgeIndex = 0;
  for (const line of parsed.lines) {
    const row = parseLine(line);
    if (/^\s*click\s+/i.test(line.text) && [...removedIds].some((nodeId) => new RegExp(`(?:^|\\s)${escapeRegExp(nodeId)}(?:\\s|$)`).test(line.text))) {
      throw new AmbiguousSourceMutationError('Subgraph contains a node with an opaque click reference.');
    }
    const classDirective = /^\s*class\s+([^\s]+)\s+\S/i.exec(line.text);
    if (classDirective?.[1]) {
      const selectors = classDirective[1].split(',');
      const matched = selectors.filter((selector) => removedIds.has(selector));
      if (matched.length) {
        if (matched.length !== selectors.length) {
          throw new AmbiguousSourceMutationError('A subgraph node shares a class directive with other nodes.');
        }
        removeLines.add(line.start);
      }
    }
    if (new RegExp(`^\\s*style\\s+${escapeRegExp(id)}(?:\\s|$)`).test(line.text)) removeLines.add(line.start);
    if (lineInGraph(line)) {
      removeLines.add(line.start);
      removedEdgeIndices.push(...(row?.edges.map((_, index) => edgeIndex + index) ?? []));
    } else if (row?.edges.length && row.nodes.some((node) => innerIds.has(node.id))) {
      if (row.edges.length > 1) {
        throw new AmbiguousSourceMutationError('Deleting a subgraph referenced by a chained edge statement is not supported.');
      }
      removeLines.add(line.start);
      removedEdgeIndices.push(...row.edges.map((_, index) => edgeIndex + index));
      for (const node of row.nodes) if (!innerIds.has(node.id) && !candidateNodes.has(node.id)) candidateNodes.set(node.id, { node, line });
    } else if (new RegExp(`^\\s*style\\s+${escapeRegExp(id)}(?:\\s|$)`).test(line.text)) {
      removeLines.add(line.start);
    }
    edgeIndex += row?.edges.length ?? 0;
  }
  const removedLines = parsed.lines.filter((line) => removeLines.has(line.start));
  const remainingReferences = new Set(parsed.edges.filter((edge) => !removeLines.has(edge.lineStart))
    .flatMap((edge) => [edge.source, edge.target]));
  const remainingDeclarations = new Set(parsed.lines.filter((line) => !removeLines.has(line.start))
    .map(isDeclarationLine).filter((declaration): declaration is NodeToken => Boolean(declaration)).map(({ id: nodeId }) => nodeId));
  const preservedByLine = new Map<number, string[]>();
  for (const [nodeId, { node, line }] of candidateNodes) {
    if (innerIds.has(nodeId) || remainingReferences.has(nodeId) || remainingDeclarations.has(nodeId)) continue;
    const declarations = preservedByLine.get(line.start) ?? [];
    const indent = /^\s*/.exec(line.text)?.[0] ?? '';
    declarations.push(`${indent}${nodeId}${shapeToken(node.shape, node.label)}`);
    preservedByLine.set(line.start, declarations);
  }
  const edits = removedLines.map((line) => {
    const ending = source.slice(line.end, line.fullEnd);
    const replacement = (preservedByLine.get(line.start) ?? []).join(ending || preferredEnding(source));
    return { start: line.start, end: line.fullEnd, text: replacement + (replacement ? ending : '') };
  });
  let result = replaceSpans(source, edits);
  const closingLine = parsed.lines.find((line) => line.fullEnd === graph.lineEnd && /^\s*end\s*;?\s*$/i.test(line.text));
  if (closingLine && closingLine.fullEnd === source.length && closingLine.end === closingLine.fullEnd && graph.lineEnd > graph.lineStart) {
    const previousEnding = /(?:\r\n|\n|\r)$/.exec(source.slice(0, graph.lineStart))?.[0];
    if (previousEnding) result = result.slice(0, graph.lineStart - previousEnding.length) + result.slice(graph.lineStart);
  }
  if (/^\s*linkStyle\b/im.test(result)) result = reindexLinkStyles(result, removedEdgeIndices);
  return result;
}
