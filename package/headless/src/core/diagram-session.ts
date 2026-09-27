import {
  addClassMember, addClassNode, addClassRelation, deleteClassMember, deleteClassNode, deleteClassRelation, listClassIds, listClassMembers,
  getClassStyle, listClassRelations, renameClassNode, setClassMember, setClassRelation, setClassStyle,
} from '../source/class-mutations';
import {
  addERAttribute, addEREntity, addERRelationship, deleteERAttribute, deleteEREntity, deleteERRelationship,
  getERStyles, listERAttributes, listEREntityIds, listERRelationships, renameEREntity, setERAttribute, setERRelationship, setERStyle,
} from '../source/er-mutations';
import {
  addFlowchartEdge, addFlowchartNode, addFlowchartSubgraph, deleteFlowchartEdge, deleteFlowchartNode, deleteFlowchartSubgraph,
  getFlowchartStyleIndex, listFlowchartEdges, listFlowchartNodes, listFlowchartSubgraphs,
  setFlowchartEdge, setFlowchartEdgeStyle, setFlowchartNode, setFlowchartNodeStyle, setFlowchartSubgraph,
} from '../source/flowchart-mutations';
import { addState, addStatePaletteItem, addStateTransition, deleteState, deleteStateTransition, getStateAppearance, listStateIds, listStateTransitions, renameState, setStateBorderType, setStateStyle, setStateTransition } from '../source/state-mutations';
import { addSequencePaletteItem } from '../source/sequence-mutations';
import { addGanttPaletteItem } from '../source/gantt-mutations';
import { addPiePaletteItem } from '../source/pie-mutations';
import { addJourneyPaletteItem } from '../source/journey-mutations';
import { addMindmapPaletteItem } from '../source/mindmap-mutations';
import { addGitgraphPaletteItem } from '../source/gitgraph-mutations';
import { addTimelinePaletteItem } from '../source/timeline-mutations';
import { addQuadrantPaletteItem } from '../source/quadrant-mutations';
import { customAlphabet } from 'nanoid';
import { diagramTypeFromSource, type EditableDiagramType } from '../runtime/diagram-catalog';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { diagramActionSchema } from './diagram-model';
import { appendSourceLines, SourceDocument } from '../source/source-document';
import { diagramLines } from '../source/palette-source';
import type { DiagramAction, DiagramEdge, DiagramElement, DiagramNode, DiagramSemanticElement, DiagramType, FlowchartNodeShape, RendererModel, SessionSnapshot, ChangeOrigin } from './diagram-model';

const makeId = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 9);
const sourceActionCapabilities: Record<EditableDiagramType, readonly DiagramAction['type'][]> = {
  flowchart: ['insert-palette-entry', 'create-node', 'create-connected-node', 'update-node', 'delete-node', 'create-edge', 'update-edge', 'delete-edge', 'create-subgraph', 'update-subgraph', 'delete-subgraph'],
  class: ['insert-palette-entry', 'create-node', 'update-node', 'delete-node', 'create-edge', 'update-edge', 'delete-edge', 'create-class-member', 'update-class-member', 'delete-class-member'],
  state: ['insert-palette-entry', 'insert-state-palette-entry', 'create-node', 'update-node', 'delete-node', 'create-edge', 'update-edge', 'delete-edge'],
  er: ['insert-palette-entry', 'create-node', 'update-node', 'delete-node', 'create-edge', 'update-edge', 'delete-edge', 'create-er-attribute', 'update-er-attribute', 'delete-er-attribute'],
  sequence: ['insert-palette-entry'], gantt: ['insert-palette-entry'], pie: ['insert-palette-entry'], journey: ['insert-palette-entry'],
  mindmap: ['insert-palette-entry'], gitgraph: ['insert-palette-entry'], timeline: ['insert-palette-entry'], quadrant: ['insert-palette-entry'],
};
const supportedTypes = Object.keys(sourceActionCapabilities) as EditableDiagramType[];

function freezeElement<T extends DiagramElement>(element: T): T {
  return Object.freeze({ ...element, attributes: Object.freeze({ ...element.attributes }) }) as unknown as T;
}

function edgeId(type: EditableDiagramType, source: string, target: string, occurrence: number): string {
  return `${type}:edge:${encodeURIComponent(source)}:${encodeURIComponent(target)}:${occurrence}`;
}

function node(id: string, diagramType: EditableDiagramType, label = id, shape?: FlowchartNodeShape, attributes: Readonly<Record<string, string>> = {}): DiagramNode {
  return freezeElement({ id: `${diagramType}:node:${encodeURIComponent(id)}`, kind: 'node', diagramType, label, ...(shape ? { shape } : {}), attributes });
}

function edge(diagramType: EditableDiagramType, source: string, target: string, operator: string, label: string, occurrence: number, attributes: Readonly<Record<string, string>> = {}): DiagramEdge {
  return freezeElement({ id: edgeId(diagramType, source, target, occurrence), kind: 'edge', diagramType, source, target, operator, label, occurrence, attributes });
}

function semanticElements(source: string, type: EditableDiagramType): DiagramSemanticElement[] {
  const result: DiagramSemanticElement[] = [];
  const occurrenceByText = new Map<string, number>();
  const headers: Partial<Record<EditableDiagramType, RegExp>> = {
    sequence: /^sequenceDiagram\b/i, gantt: /^gantt\b/i, pie: /^pie\b/i,
    journey: /^journey\b/i, mindmap: /^mindmap\b/i, gitgraph: /^gitGraph\b/i,
    timeline: /^timeline\b/i, quadrant: /^quadrantChart\b/i,
  };
  const options = type === 'mindmap' ? { accessibilityMetadata: false, lineComment: /^%%/ } : {};
  const statements = diagramLines(source, headers[type] ?? /^.+$/, options).slice(1);
  let previousStart = 0;
  let sourceLine = 0;
  for (const { text: statement, start } of statements) {
    sourceLine += (source.slice(previousStart, start).match(/\r\n|\r|\n/g) ?? []).length;
    previousStart = start;
    const trimmed = statement.trim();
    if (!trimmed) continue;
    const occurrence = occurrenceByText.get(trimmed) ?? 0;
    occurrenceByText.set(trimmed, occurrence + 1);
    const semanticType = type === 'sequence'
      ? (/(?:-->|==>|-x|--x|--)\S*/.test(trimmed) ? 'message' : /^(participant|actor|box|autonumber|title|note)\b/i.exec(trimmed)?.[1]?.toLowerCase() ?? 'directive')
      : type === 'gantt' ? (/^section\b/i.test(trimmed) ? 'section' : /^title\b/i.test(trimmed) ? 'title' : /dateFormat|axisFormat|excludes|todayMarker|tickInterval/i.test(trimmed) ? 'configuration' : 'task')
      : type === 'pie' ? (/^title\b/i.test(trimmed) ? 'title' : /^(showData|accTitle|accDescr)\b/i.test(trimmed) ? 'configuration' : 'slice')
      : type === 'journey' ? (/^section\b/i.test(trimmed) ? 'section' : /^title\b/i.test(trimmed) ? 'title' : 'task')
      : type === 'mindmap' ? (/^root\b/i.test(trimmed) ? 'root' : 'branch')
      : type === 'gitgraph' ? (/^(branch|checkout|merge)\b/i.test(trimmed) ? trimmed.split(/\s+/)[0]!.toLowerCase() : 'commit')
      : type === 'timeline' ? (/^section\b/i.test(trimmed) ? 'section' : /^title\b/i.test(trimmed) ? 'title' : 'event')
      : type === 'quadrant' ? (/^quadrant-[1-4]\b/i.test(trimmed) ? 'quadrant' : /^title\b/i.test(trimmed) ? 'title' : /axis/i.test(trimmed) ? 'axis' : 'point')
      : 'statement';
    result.push(freezeElement({
      id: `${type}:line:${sourceLine}:${occurrence}`, kind: 'semantic', diagramType: type,
      semanticType, sourceLine, statement, attributes: { occurrence: String(occurrence) },
    }));
  }
  return result;
}

function parseElements(source: string, diagramType: DiagramType): DiagramElement[] {
  if (!supportedTypes.includes(diagramType as EditableDiagramType)) return [];
  const type = diagramType as EditableDiagramType;
  if (type === 'flowchart') {
    const styles = getFlowchartStyleIndex(source);
    const nodes = listFlowchartNodes(source).map((entry) => node(entry.id, type, entry.label, entry.shape, {
      fill: styles.elements.get(entry.id)?.fill ?? '',
      stroke: styles.elements.get(entry.id)?.stroke ?? '',
      borderType: styles.elements.get(entry.id)?.['stroke-dasharray'] ?? '',
    }));
    const edges = listFlowchartEdges(source).map((entry, index) => edge(type, entry.source, entry.target, entry.operator, entry.label, entry.occurrence, {
      stroke: styles.edges.get(index) ?? '',
    }));
    const subgraphs = listFlowchartSubgraphs(source).map((entry) => freezeElement({
      id: `${type}:subgraph:${encodeURIComponent(entry.id)}`, kind: 'subgraph' as const, diagramType: 'flowchart' as const, label: entry.title,
      attributes: {
        sourceId: entry.id,
        fill: styles.elements.get(entry.id)?.fill ?? '',
        stroke: styles.elements.get(entry.id)?.stroke ?? '',
        borderType: styles.elements.get(entry.id)?.['stroke-dasharray'] ?? '',
      },
    }));
    return [...nodes, ...edges, ...subgraphs];
  }
  if (type === 'class') {
    const nodes = listClassIds(source).map((id) => node(id, type, id, undefined, {
      fill: getClassStyle(source, id, 'fill'), stroke: getClassStyle(source, id, 'stroke'), borderType: getClassStyle(source, id, 'stroke-dasharray'),
    }));
    const members = nodes.flatMap((item) => {
      let classMembers: string[] = [];
      try { classMembers = listClassMembers(source, publicId(item.id, type)); } catch { /* Keep unsupported member syntax in the source. */ }
      return classMembers.map((member, index) => freezeElement({
        id: `${type}:member:${encodeURIComponent(item.id)}:${index}`, kind: 'semantic' as const, diagramType: type,
        semanticType: 'member', sourceLine: index, statement: member, attributes: { owner: publicId(item.id, type), occurrence: String(index) },
      }));
    });
    const edges = listClassRelations(source).map((entry) => edge(type, entry.source, entry.target, entry.operator, '', entry.occurrence));
    return [...nodes, ...edges, ...members];
  }
  if (type === 'state') {
    const nodes = listStateIds(source).map((id) => {
      const appearance = getStateAppearance(source, id);
      return node(id, type, id, undefined, { fill: appearance.fill, stroke: appearance.stroke, borderType: appearance.borderType });
    });
    const edges = listStateTransitions(source).map((entry) => edge(type, entry.source, entry.target, '-->', entry.label, entry.occurrence));
    return [...nodes, ...edges];
  }
  if (type === 'er') {
    const nodes = listEREntityIds(source).map((id) => {
      const appearance = getERStyles(source, id);
      return node(id, type, id, undefined, { fill: appearance.fill, stroke: appearance.stroke, borderType: appearance['stroke-dasharray'] });
    });
    const attrs = nodes.flatMap((item) => {
      let entityAttributes: ReturnType<typeof listERAttributes> = [];
      try { entityAttributes = listERAttributes(source, publicId(item.id, type)); } catch { /* Keep unsupported attribute syntax in the source. */ }
      return entityAttributes.map((attribute) => freezeElement({
        id: `${type}:attribute:${encodeURIComponent(attribute.entity)}:${encodeURIComponent(attribute.name)}:${attribute.occurrence}`,
        kind: 'semantic' as const, diagramType: type, semanticType: 'attribute', sourceLine: attribute.occurrence,
        statement: `${attribute.type} ${attribute.name}`, attributes: { entity: attribute.entity, type: attribute.type, name: attribute.name, key: attribute.key, comment: attribute.comment, occurrence: String(attribute.occurrence) },
      }));
    });
    const edges = listERRelationships(source).map((entry) => edge(type, entry.source, entry.target, entry.cardinality, entry.label, entry.occurrence, { identifying: String(entry.identifying) }));
    return [...nodes, ...edges, ...attrs];
  }
  return semanticElements(source, type);
}

function makeModel(source: string, sourceRevision: number, modelRevision: number): RendererModel {
  const detected = diagramTypeFromSource(source);
  const diagramType: DiagramType = detected ?? (source.trim() ? 'unsupported' : 'unknown');
  let elements: DiagramElement[] = [];
  if (detected) {
    try { elements = parseElements(source, detected); } catch { elements = []; }
  }
  return Object.freeze({
    diagramType, revision: modelRevision, sourceRevision,
    elements: Object.freeze(elements),
    parseState: diagramType === 'unsupported' ? 'unsupported' : diagramType === 'unknown' ? 'unknown' : 'pending',
  });
}

function publicId(elementId: string, type: EditableDiagramType): string {
  if (!elementId.startsWith(`${type}:node:`)) return elementId;
  try { return decodeURIComponent(elementId.slice(`${type}:node:`.length)); }
  catch { return elementId.slice(`${type}:node:`.length); }
}

function publicSubgraphId(elementId: string): string {
  const prefix = 'flowchart:subgraph:';
  const rawId = elementId.startsWith(prefix) ? elementId.slice(prefix.length) : elementId;
  try { return decodeURIComponent(rawId); }
  catch { return rawId; }
}

function applyAction(source: string, type: EditableDiagramType, action: DiagramAction): string {
  if (action.type === 'insert-state-palette-entry') {
    if (type !== 'state') throw new Error('State palette entries are only available in state diagrams.');
    return addStatePaletteItem(source, action.item, action.stateId, action.label);
  }
  if (action.type === 'insert-palette-entry') {
    const item = action.paletteItem;
    if (type === 'sequence' && item) return addSequencePaletteItem(source, item as Parameters<typeof addSequencePaletteItem>[1]);
    if (type === 'gantt' && item) return addGanttPaletteItem(source, item as Parameters<typeof addGanttPaletteItem>[1]);
    if (type === 'pie' && item) return addPiePaletteItem(source, item as Parameters<typeof addPiePaletteItem>[1]);
    if (type === 'journey' && item) return addJourneyPaletteItem(source, item as Parameters<typeof addJourneyPaletteItem>[1]);
    if (type === 'mindmap' && item) return addMindmapPaletteItem(source, item as Parameters<typeof addMindmapPaletteItem>[1]);
    if (type === 'gitgraph' && item) return addGitgraphPaletteItem(source, item as Parameters<typeof addGitgraphPaletteItem>[1]);
    if (type === 'timeline' && item) return addTimelinePaletteItem(source, item as Parameters<typeof addTimelinePaletteItem>[1]);
    if (type === 'quadrant' && item) return addQuadrantPaletteItem(source, item as Parameters<typeof addQuadrantPaletteItem>[1]);
    if (!action.snippet.trim() || /[\r\n]/.test(action.snippet)) throw new Error('Palette insertion requires one Mermaid statement.');
    return appendSourceLines(source, [action.snippet], type);
  }
  if (action.type === 'create-node') {
    const id = action.id ?? (type === 'state' ? `State${makeId()}` : type === 'class' ? `Class-${makeId()}` : type === 'er' ? `Entity-${makeId()}` : `node-${makeId()}`);
    const label = action.label ?? id;
    if (type === 'flowchart') return addFlowchartNode(source, id, label, (action.shape as Parameters<typeof addFlowchartNode>[3]) ?? 'rect');
    if (type === 'class') {
      const next = addClassNode(source, id);
      if (!action.empty) return next;
      const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return next.replace(new RegExp(`(class\\s+${escapedId})\\s*\\{\\s*\\}(\\s*)$`), '$1$2');
    }
    if (type === 'state') return addState(source, id);
    if (type === 'er') {
      const next = addEREntity(source, id);
      if (!action.withDefaultAttribute) return next;
      const newEntityId = listEREntityIds(next).find((entityId) => !listEREntityIds(source).includes(entityId));
      return newEntityId ? addERAttribute(next, newEntityId) : next;
    }
    throw new Error(`Node creation is not supported for ${type}.`);
  }
  if (action.type === 'create-connected-node') {
    if (type !== 'flowchart') throw new Error('Connected palette nodes are only available for flowcharts.');
    const id = action.id ?? `node-${makeId()}`;
    const withNode = addFlowchartNode(source, id, action.label ?? id,
      (action.shape as Parameters<typeof addFlowchartNode>[3]) ?? 'rect');
    return addFlowchartEdge(withNode, action.source, id);
  }
  if (action.type === 'update-node') {
    const id = publicId(action.id, type);
    let next = source;
    if (type === 'flowchart') {
      const { id: nextId, label, shape } = action.patch;
      if (nextId !== undefined || label !== undefined || shape !== undefined) {
        next = setFlowchartNode(next, id, {
          ...(nextId !== undefined ? { id: nextId } : {}),
          ...(label !== undefined ? { label } : {}),
          ...(shape !== undefined ? { shape } : {}),
        });
      }
    } else if (action.patch.id !== undefined) {
      if (type === 'class') next = renameClassNode(next, id, action.patch.id);
      else if (type === 'state') next = renameState(next, id, action.patch.id);
      else if (type === 'er') next = renameEREntity(next, id, action.patch.id);
    }
    if (action.patch.fill !== undefined || action.patch.stroke !== undefined || action.patch.borderType !== undefined) {
      for (const property of ['fill', 'stroke'] as const) {
        const value = action.patch[property];
        if (value === undefined) continue;
        if (type === 'flowchart') next = setFlowchartNodeStyle(next, action.patch.id ?? id, property, value);
        else if (type === 'class') next = setClassStyle(next, action.patch.id ?? id, property, value);
        else if (type === 'state') next = setStateStyle(next, action.patch.id ?? id, property, value);
        else if (type === 'er') next = setERStyle(next, action.patch.id ?? id, property, value);
        else throw new Error(`Node appearance is not supported for ${type}.`);
      }
      const borderType = action.patch.borderType;
      if (borderType !== undefined) {
        if (type === 'state') {
          if (borderType === 'default') next = setStateStyle(setStateStyle(next, action.patch.id ?? id, 'stroke-dasharray', ''), action.patch.id ?? id, 'stroke-width', '');
          else next = setStateBorderType(next, action.patch.id ?? id, borderType);
        } else {
          const value = { default: '', solid: '0', dashed: '6 4', dotted: '2 3' }[borderType];
          if (type === 'flowchart') next = setFlowchartNodeStyle(next, action.patch.id ?? id, 'stroke-dasharray', value);
          else if (type === 'class') next = setClassStyle(next, action.patch.id ?? id, 'stroke-dasharray', value);
          else if (type === 'er') next = setERStyle(next, action.patch.id ?? id, 'stroke-dasharray', value);
          else throw new Error(`Node appearance is not supported for ${type}.`);
        }
      }
    }
    if (next === source) throw new Error(`Node update is not supported for ${type}.`);
    return next;
  }
  if (action.type === 'delete-node') {
    const id = publicId(action.id, type);
    if (type === 'flowchart') return deleteFlowchartNode(source, id);
    if (type === 'class') return deleteClassNode(source, id);
    if (type === 'state') return deleteState(source, id);
    if (type === 'er') return deleteEREntity(source, id);
    throw new Error(`Node deletion is not supported for ${type}.`);
  }
  if (action.type === 'create-subgraph') {
    if (type !== 'flowchart') throw new Error('Subgraphs are only available in flowcharts.');
    const id = action.id ?? `group-${makeId()}`;
    return addFlowchartSubgraph(source, id, action.title ?? `Group ${id}`);
  }
  if (action.type === 'update-subgraph') {
    if (type !== 'flowchart') throw new Error('Subgraphs are only available in flowcharts.');
    const id = publicSubgraphId(action.id);
    return setFlowchartSubgraph(source, id, {
      ...(action.patch.id !== undefined ? { id: action.patch.id } : {}),
      ...(action.patch.title !== undefined ? { title: action.patch.title } : {}),
      ...(action.patch.fill !== undefined ? { fill: action.patch.fill } : {}),
      ...(action.patch.stroke !== undefined ? { stroke: action.patch.stroke } : {}),
      ...(action.patch.borderType !== undefined ? { borderType: action.patch.borderType } : {}),
    });
  }
  if (action.type === 'delete-subgraph') {
    if (type !== 'flowchart') throw new Error('Subgraphs are only available in flowcharts.');
    return deleteFlowchartSubgraph(source, publicSubgraphId(action.id));
  }
  if (action.type === 'create-edge') {
    if (type === 'flowchart') return addFlowchartEdge(source, action.source, action.target, action.operator, action.label);
    if (type === 'class') return addClassRelation(source, action.source, action.target, action.operator as Parameters<typeof addClassRelation>[3]);
    if (type === 'state') return addStateTransition(source, action.source, action.target, action.label);
    if (type === 'er') return addERRelationship(source, action.source, action.target, action.cardinality, action.label, action.identifying);
    throw new Error(`Edge creation is not supported for ${type}.`);
  }
  if (action.type === 'create-class-member') {
    if (type !== 'class') throw new Error('Class members are only available in class diagrams.');
    return addClassMember(source, action.classId, action.member);
  }
  if (action.type === 'update-class-member') {
    if (type !== 'class') throw new Error('Class members are only available in class diagrams.');
    return setClassMember(source, action.classId, action.oldMember, action.newMember);
  }
  if (action.type === 'delete-class-member') {
    if (type !== 'class') throw new Error('Class members are only available in class diagrams.');
    return deleteClassMember(source, action.classId, action.member);
  }
  if (action.type === 'create-er-attribute') {
    if (type !== 'er') throw new Error('Entity attributes are only available in ER diagrams.');
    return addERAttribute(source, action.entity, action.attribute ? {
      ...(action.attribute.type !== undefined ? { type: action.attribute.type } : {}),
      ...(action.attribute.name !== undefined ? { name: action.attribute.name } : {}),
      ...(action.attribute.key !== undefined ? { key: action.attribute.key } : {}),
      ...(action.attribute.comment !== undefined ? { comment: action.attribute.comment } : {}),
    } : undefined);
  }
  if (action.type === 'update-er-attribute') {
    if (type !== 'er') throw new Error('Entity attributes are only available in ER diagrams.');
    return setERAttribute(source, action.entity, { name: action.name, occurrence: action.occurrence }, {
      ...(action.patch.type !== undefined ? { type: action.patch.type } : {}),
      ...(action.patch.name !== undefined ? { name: action.patch.name } : {}),
      ...(action.patch.key !== undefined ? { key: action.patch.key } : {}),
      ...(action.patch.comment !== undefined ? { comment: action.patch.comment } : {}),
    });
  }
  if (action.type === 'delete-er-attribute') {
    if (type !== 'er') throw new Error('Entity attributes are only available in ER diagrams.');
    return deleteERAttribute(source, action.entity, { name: action.name, occurrence: action.occurrence });
  }
  if (action.type === 'update-edge') {
    const current = (parseElements(source, type).find((item) => item.kind === 'edge' && item.id === action.id)) as DiagramEdge | undefined;
    if (!current) throw new Error('The selected relationship no longer exists.');
    if (type === 'flowchart') {
      const raw = listFlowchartEdges(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      if (!raw) throw new Error('The selected relationship is ambiguous.');
      let next = action.patch.stroke !== undefined ? setFlowchartEdgeStyle(source, raw, action.patch.stroke) : source;
      const currentRaw = listFlowchartEdges(next).find((candidate) => candidate.source === raw.source
        && candidate.target === raw.target && candidate.occurrence === raw.occurrence);
      if (!currentRaw) throw new Error('The selected relationship changed during style editing.');
      next = setFlowchartEdge(next, currentRaw, {
        ...(action.patch.source !== undefined ? { source: action.patch.source } : {}),
        ...(action.patch.target !== undefined ? { target: action.patch.target } : {}),
        ...(action.patch.operator !== undefined ? { operator: action.patch.operator } : {}),
        ...(action.patch.label !== undefined ? { label: action.patch.label } : {}),
      });
      return next;
    }
    if (type === 'class') {
      const raw = listClassRelations(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      if (!raw) throw new Error('The selected relationship is ambiguous.');
      return setClassRelation(source, raw, {
        ...(action.patch.source ? { source: action.patch.source } : {}),
        ...(action.patch.target ? { target: action.patch.target } : {}),
        ...(action.patch.operator ? { operator: action.patch.operator as NonNullable<Parameters<typeof setClassRelation>[2]['operator']> } : {}),
      });
    }
    if (type === 'state') {
      const raw = listStateTransitions(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      if (!raw) throw new Error('The selected transition is ambiguous.');
      return setStateTransition(source, raw, {
        ...(action.patch.source !== undefined ? { source: action.patch.source } : {}),
        ...(action.patch.target !== undefined ? { target: action.patch.target } : {}),
        ...(action.patch.label !== undefined ? { label: action.patch.label } : {}),
      });
    }
    if (type === 'er') {
      const raw = listERRelationships(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      if (!raw) throw new Error('The selected relationship is ambiguous.');
      return setERRelationship(source, raw, {
        ...(action.patch.source !== undefined ? { source: action.patch.source } : {}),
        ...(action.patch.target !== undefined ? { target: action.patch.target } : {}),
        ...(action.patch.label !== undefined ? { label: action.patch.label } : {}),
        ...(action.patch.cardinality !== undefined ? { cardinality: action.patch.cardinality } : {}),
        ...(action.patch.identifying !== undefined ? { identifying: action.patch.identifying } : {}),
      });
    }
    throw new Error(`Edge update is not supported for ${type}.`);
  }
  if (action.type === 'delete-edge') {
    if (type === 'flowchart') {
      const raw = listFlowchartEdges(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      return raw ? deleteFlowchartEdge(source, raw) : source;
    }
    if (type === 'class') {
      const raw = listClassRelations(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      return raw ? deleteClassRelation(source, raw) : source;
    }
    if (type === 'state') {
      const raw = listStateTransitions(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      return raw ? deleteStateTransition(source, raw) : source;
    }
    if (type === 'er') {
      const raw = listERRelationships(source).find((item) => edgeId(type, item.source, item.target, item.occurrence) === action.id);
      return raw ? deleteERRelationship(source, raw) : source;
    }
    throw new Error(`Edge deletion is not supported for ${type}.`);
  }
  return source;
}

export class DiagramSession {
  #source: string;
  #sourceRevision = 0;
  #modelRevision = 0;
  #model: RendererModel;
  #origin: ChangeOrigin = 'host';
  #history: string[];
  #historyIndex = 0;
  readonly store: StoreApi<SessionSnapshot>;

  constructor(initialSource: string) {
    this.#source = initialSource;
    this.#history = [initialSource];
    this.#model = makeModel(initialSource, this.#sourceRevision, this.#modelRevision);
    this.store = createStore<SessionSnapshot>(() => this.#createSnapshot());
  }

  #createSnapshot(): SessionSnapshot {
    return Object.freeze({
      codeBlock: Object.freeze({ source: this.#source, revision: this.#sourceRevision }),
      model: this.#model, origin: this.#origin,
      canUndo: this.#historyIndex > 0, canRedo: this.#historyIndex < this.#history.length - 1,
    });
  }

  #publish(): void { this.store.setState(this.#createSnapshot()); }

  getSnapshot = (): SessionSnapshot => this.store.getState();
  getServerSnapshot = (): SessionSnapshot => this.store.getInitialState();
  subscribe = (listener: () => void): (() => void) => this.store.subscribe(listener);

  setSource(source: string, origin: ChangeOrigin = 'host'): boolean {
    if (source === this.#source) return false;
    this.#source = source;
    this.#sourceRevision++;
    this.#modelRevision++;
    this.#origin = origin;
    this.#model = makeModel(source, this.#sourceRevision, this.#modelRevision);
    if (origin === 'host') {
      this.#history = [source];
      this.#historyIndex = 0;
    } else {
      this.#history.splice(this.#historyIndex + 1);
      // TODO: Bound or coalesce history; a full source snapshot per edit can consume unbounded memory.
      this.#history.push(source);
      this.#historyIndex = this.#history.length - 1;
    }
    this.#publish();
    return true;
  }

  dispatch(action: DiagramAction): string | undefined {
    const validation = diagramActionSchema.safeParse(action);
    if (!validation.success) throw new TypeError(validation.error.issues[0]?.message ?? 'Invalid diagram action.');
    const type = this.#model.diagramType;
    if (!supportedTypes.includes(type as EditableDiagramType) || this.#model.sourceRevision !== this.#sourceRevision || this.#model.parseState !== 'parsed') return undefined;
    if (!sourceActionCapabilities[type as EditableDiagramType].includes(validation.data.type)) {
      throw new Error(`The ${type} diagram does not support ${validation.data.type}.`);
    }
    const sourceDocument = new SourceDocument(this.#source, type);
    const candidate = applyAction(this.#source, type as EditableDiagramType, validation.data);
    const next = sourceDocument.serializeMutation(candidate);
    if (next === this.#source) return undefined;
    this.setSource(next, 'diagram-action');
    return next;
  }

  setParseResult(sourceRevision: number, valid: boolean): void {
    if (sourceRevision !== this.#sourceRevision) return;
    if (this.#model.parseState === 'unsupported' || this.#model.parseState === 'unknown') return;
    const parseState = valid ? 'parsed' : 'invalid';
    if (this.#model.parseState === parseState) return;
    this.#model = Object.freeze({ ...this.#model, parseState, elements: valid ? this.#model.elements : Object.freeze([]) });
    this.#publish();
  }

  undo(): string | undefined {
    if (this.#historyIndex <= 0) return undefined;
    this.#historyIndex--;
    this.#restoreHistory();
    return this.#source;
  }

  redo(): string | undefined {
    if (this.#historyIndex >= this.#history.length - 1) return undefined;
    this.#historyIndex++;
    this.#restoreHistory();
    return this.#source;
  }

  #restoreHistory(): void {
    this.#source = this.#history[this.#historyIndex]!;
    this.#sourceRevision++;
    this.#modelRevision++;
    this.#origin = 'history';
    this.#model = makeModel(this.#source, this.#sourceRevision, this.#modelRevision);
    this.#publish();
  }
}
