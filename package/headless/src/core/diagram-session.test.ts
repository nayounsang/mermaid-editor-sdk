import { describe, expect, it, vi } from 'vitest';
import { DiagramSession } from './diagram-session';
import { paletteCatalog, templates } from '../runtime/diagram-catalog';

describe('DiagramSession snapshots and history', () => {
  it('tracks revisions, publishes immutable snapshots, and manages host and edit history', () => {
    const initial = 'flowchart TD\n  A-->B';
    const session = new DiagramSession(initial);
    const listener = vi.fn();
    const unsubscribe = session.subscribe(listener);
    expect(session.getSnapshot()).toMatchObject({ codeBlock: { source: initial, revision: 0 }, model: { diagramType: 'flowchart', revision: 0, sourceRevision: 0, parseState: 'pending' }, origin: 'host', canUndo: false, canRedo: false });
    expect(Object.isFrozen(session.getSnapshot())).toBe(true);
    expect(session.getServerSnapshot()).toEqual(session.getSnapshot());
    expect(session.setSource(initial)).toBe(false);
    expect(session.setSource('flowchart TD\n  A-->C', 'source-editor')).toBe(true);
    expect(session.getSnapshot()).toMatchObject({ codeBlock: { revision: 1 }, model: { revision: 1 }, origin: 'source-editor', canUndo: true, canRedo: false });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(session.undo()).toBe(initial);
    expect(session.getSnapshot()).toMatchObject({ origin: 'history', canUndo: false, canRedo: true, codeBlock: { revision: 2 } });
    expect(session.undo()).toBeUndefined();
    expect(session.redo()).toBe('flowchart TD\n  A-->C');
    expect(session.redo()).toBeUndefined();
    session.setSource('flowchart TD\n  X-->Y', 'host');
    expect(session.getSnapshot()).toMatchObject({ origin: 'host', canUndo: false, canRedo: false });
    expect(session.undo()).toBeUndefined();
    unsubscribe();
    session.setSource('flowchart TD\n  X-->Z');
    expect(listener).toHaveBeenCalledTimes(4);
  });

  it('ignores stale parse results and handles valid, invalid, unsupported, and unknown parse states', () => {
    const session = new DiagramSession('flowchart TD\n  A-->B');
    session.setParseResult(1, true);
    expect(session.getSnapshot().model.parseState).toBe('pending');
    session.setParseResult(0, true);
    expect(session.getSnapshot().model.parseState).toBe('parsed');
    session.setParseResult(0, true);
    expect(session.getSnapshot().model.parseState).toBe('parsed');
    session.setParseResult(0, false);
    expect(session.getSnapshot().model.parseState).toBe('invalid');
    expect(session.getSnapshot().model.elements).toEqual([]);
    session.setParseResult(0, true);
    expect(session.getSnapshot().model.parseState).toBe('parsed');

    const unsupported = new DiagramSession('plain text');
    unsupported.setParseResult(0, false);
    expect(unsupported.getSnapshot().model.parseState).toBe('unsupported');
    expect(new DiagramSession('').getSnapshot().model.parseState).toBe('unknown');
  });

  it('rejects malformed actions and gates dispatch on parsed supported diagrams', () => {
    const invalid = new DiagramSession('flowchart TD\n  A-->B');
    expect(() => invalid.dispatch({ type: 'create-node', id: '' })).toThrow(TypeError);
    expect(invalid.dispatch({ type: 'create-node', id: 'C' })).toBeUndefined();
    invalid.setParseResult(0, true);
    expect(() => invalid.dispatch({ type: 'create-class-member', classId: 'A' })).toThrow('does not support create-class-member');

    const unsupported = new DiagramSession('plain text');
    expect(unsupported.dispatch({ type: 'create-node', id: 'A' })).toBeUndefined();
    expect(unsupported.dispatch({ type: 'insert-palette-entry', snippet: 'x' })).toBeUndefined();
  });

  it('returns no change when a supported node update leaves source unchanged', () => {
    const source = 'flowchart TD\n  A[Alpha]-->B';
    const session = new DiagramSession(source);
    session.setParseResult(0, true);

    expect(session.dispatch({ type: 'update-node', id: 'flowchart:node:A', patch: { label: 'Alpha' } })).toBeUndefined();
    expect(session.getSnapshot().codeBlock.source).toBe(source);
  });

  it('creates and edits flowchart elements, styles, subgraphs, and relationships', () => {
    const session = new DiagramSession('flowchart TD\n  A[Alpha]-->B[Beta]\n  subgraph group[Group]\n    C-->D\n  end');
    session.setParseResult(0, true);
    const dispatch = (action: Parameters<DiagramSession['dispatch']>[0]) => {
      const result = session.dispatch(action);
      session.setParseResult(session.getSnapshot().codeBlock.revision, true);
      return result;
    };
    expect(dispatch({ type: 'create-node', id: 'E', label: 'Echo', shape: 'diamond' })).toContain('E{Echo}');
    const connected = dispatch({ type: 'create-connected-node', source: 'A', id: 'F', label: 'Foxtrot' })!;
    expect(connected).toContain('F[Foxtrot]');
    expect(connected).toContain('A --> F');
    expect(dispatch({ type: 'update-node', id: 'flowchart:node:A', patch: { id: 'A2', label: 'Changed', shape: 'round', fill: 'red', stroke: 'blue', borderType: 'dashed' } })).toContain('A2');
    expect(dispatch({ type: 'update-node', id: 'flowchart:node:A2', patch: { borderType: 'default' } })).toContain('style A2');
    expect(dispatch({ type: 'create-edge', source: 'A2', target: 'B', label: 'next' })).toContain('next');
    const edgeId = session.getSnapshot().model.elements.find((item) => item.kind === 'edge')!.id;
    expect(dispatch({ type: 'update-edge', id: edgeId, patch: { source: 'B', target: 'A2', label: 'back', operator: '==>', stroke: 'red' } })).toContain('back');
    expect(dispatch({ type: 'delete-edge', id: edgeId })).toBeDefined();
    expect(dispatch({ type: 'create-subgraph', id: 'new-group', title: 'New Group' })).toContain('New Group');
    const subgraphId = session.getSnapshot().model.elements.find((item) => item.kind === 'subgraph')!.id;
    expect(dispatch({ type: 'update-subgraph', id: subgraphId, patch: { title: 'Renamed', fill: 'pink', stroke: 'red', borderType: 'dotted' } })).toContain('Renamed');
    expect(() => dispatch({ type: 'delete-subgraph', id: 'flowchart:subgraph:group' })).toThrow('unsupported edge syntax');
    const simpleSubgraph = new DiagramSession('flowchart TD\n  subgraph group\n    A\n  end');
    simpleSubgraph.setParseResult(0, true);
    expect(simpleSubgraph.dispatch({ type: 'delete-subgraph', id: 'flowchart:subgraph:group' })).toContain('flowchart TD');
    expect(() => dispatch({ type: 'delete-node', id: 'flowchart:node:A2' })).toThrow('cannot be indexed safely');
    const simpleNodes = new DiagramSession('flowchart TD\n  A\n  B');
    simpleNodes.setParseResult(0, true);
    expect(simpleNodes.dispatch({ type: 'delete-node', id: 'flowchart:node:A' })).toContain('flowchart TD');
  });

  it('inserts one-line palette entries and rejects malformed or ambiguous mutations', () => {
    const session = new DiagramSession('flowchart TD\n  A-->B');
    session.setParseResult(0, true);
    expect(session.dispatch({ type: 'insert-palette-entry', snippet: '  B-->C' })).toContain('B-->C');
    session.setParseResult(session.getSnapshot().codeBlock.revision, true);
    expect(() => session.dispatch({ type: 'insert-palette-entry', snippet: 'A\nB' })).toThrow('one Mermaid statement');
  });

  it('builds semantic models for every supported diagram syntax', () => {
    for (const [type, source] of Object.entries(templates)) {
      const session = new DiagramSession(source);
      const model = session.getSnapshot().model;
      expect(model.diagramType, type).toBe(type);
      expect(model.elements.length, type).toBeGreaterThan(0);
      expect(model.elements.every((element) => Object.isFrozen(element.attributes)), type).toBe(true);
    }
    expect(new DiagramSession('sequenceDiagram\n%% note\nparticipant A\nA->>B: hello').getSnapshot().model.elements.map((item) => item.kind))
      .toEqual(['semantic', 'semantic']);
    expect(new DiagramSession('mindmap\nroot((X))\n%% hidden\n  A').getSnapshot().model.elements.map((item) => item.kind))
      .toEqual(['semantic', 'semantic']);
  });

  it('routes class, state, and ER actions through their source mutation capabilities', () => {
    const apply = (source: string, actions: Parameters<DiagramSession['dispatch']>[0][]) => {
      const session = new DiagramSession(source);
      session.setParseResult(0, true);
      let result = source;
      for (const action of actions) {
        result = session.dispatch(action) ?? result;
        session.setParseResult(session.getSnapshot().codeBlock.revision, true);
      }
      return { session, result };
    };

    const classDiagram = apply('classDiagram\nclass A\nclass B\nA --> B\n', [
      { type: 'create-node', id: 'C', empty: true },
      { type: 'update-node', id: 'class:node:C', patch: { id: 'D', fill: '#eee', stroke: '#111', borderType: 'solid' } },
      { type: 'create-class-member', classId: 'D', member: '+name: string' },
      { type: 'update-class-member', classId: 'D', oldMember: '+name: string', newMember: '+title: string' },
      { type: 'delete-class-member', classId: 'D', member: '+title: string' },
      { type: 'create-edge', source: 'A', target: 'D', operator: '*--' },
    ]);
    expect(classDiagram.result).toContain('A *-- D');
    const classEdge = classDiagram.session.getSnapshot().model.elements.find((item) => item.kind === 'edge')!;
    expect(classDiagram.session.dispatch({ type: 'update-edge', id: classEdge.id, patch: { source: 'B', target: 'D', operator: '<|--' } })).toContain('B <|-- D');
    classDiagram.session.setParseResult(classDiagram.session.getSnapshot().codeBlock.revision, true);
    const updatedClassEdge = classDiagram.session.getSnapshot().model.elements.find((item) => item.kind === 'edge')!;
    expect(classDiagram.session.dispatch({ type: 'delete-edge', id: updatedClassEdge.id })).toBeDefined();

    const stateDiagram = apply('stateDiagram-v2\nA --> B : next\n', [
      { type: 'create-node', id: 'C' },
      { type: 'update-node', id: 'state:node:C', patch: { id: 'Ready', fill: '#eee', stroke: '#111', borderType: 'dashed' } },
      { type: 'create-edge', source: 'Ready', target: 'B', label: 'back' },
      { type: 'insert-state-palette-entry', item: 'choice', stateId: 'Decision', label: 'Choose' },
    ]);
    expect(stateDiagram.result).toContain('Choice1');
    const stateEdge = stateDiagram.session.getSnapshot().model.elements.find((item) => item.kind === 'edge')!;
    stateDiagram.session.setParseResult(stateDiagram.session.getSnapshot().codeBlock.revision, true);
    expect(stateDiagram.session.dispatch({ type: 'update-edge', id: stateEdge.id, patch: { label: 'revised', target: 'Decision' } })).toContain('revised');

    const erDiagram = apply('erDiagram\nCUSTOMER ||--o{ ORDER : places\nCUSTOMER {\n string id PK\n}\nORDER\n', [
      { type: 'create-node', id: 'ITEM', withDefaultAttribute: true },
      { type: 'update-node', id: 'er:node:ITEM', patch: { id: 'LINE_ITEM', fill: '#eee', stroke: '#111', borderType: 'dotted' } },
      { type: 'create-er-attribute', entity: 'LINE_ITEM', attribute: { type: 'string', name: 'sku', key: 'PK', comment: 'Stock code' } },
      { type: 'update-er-attribute', entity: 'LINE_ITEM', name: 'sku', occurrence: 0, patch: { name: 'code', type: 'varchar', key: 'UK' } },
      { type: 'delete-er-attribute', entity: 'LINE_ITEM', name: 'code', occurrence: 0 },
      { type: 'create-edge', source: 'CUSTOMER', target: 'LINE_ITEM', cardinality: 'one-many', label: 'contains', identifying: true },
    ]);
    expect(erDiagram.result).toContain('LINE_ITEM');
    const erEdge = erDiagram.session.getSnapshot().model.elements.filter((item) => item.kind === 'edge').at(-1)!;
    erDiagram.session.setParseResult(erDiagram.session.getSnapshot().codeBlock.revision, true);
    expect(erDiagram.session.dispatch({ type: 'update-edge', id: erEdge.id, patch: { source: 'ORDER', cardinality: 'many-many', label: 'includes', identifying: false } })).toContain('includes');
  });

  it('routes the type-specific source palette entries for semantic diagrams', () => {
    const routes = [
      { type: 'pie', source: 'pie', item: 'slice', label: 'Slice' },
      { type: 'journey', source: 'journey\n    section Phase', item: 'task', label: 'Task' },
      { type: 'mindmap', source: 'mindmap\n  root((Root))', item: 'branch', label: 'Branch' },
      { type: 'gitgraph', source: 'gitGraph\n    commit', item: 'commit', label: 'Commit' },
      { type: 'timeline', source: 'timeline', item: 'event', label: 'Event' },
      { type: 'quadrant', source: 'quadrantChart', item: 'point', label: 'Data point' },
    ] as const;
    for (const { type, source, item, label } of routes) {
      const entry = paletteCatalog[type]?.find((candidate) => candidate.label === label);
      expect(entry, `${type}: ${label} catalog entry`).toBeDefined();
      const session = new DiagramSession(source);
      session.setParseResult(0, true);
      const result = session.dispatch({ type: 'insert-palette-entry', snippet: entry!.snippet, paletteItem: item });
      expect(result, `${type}: ${label}`).toBeDefined();
      expect(result, `${type}: ${label}`).not.toBe(source);
    }
    for (const type of ['sequence', 'gantt'] as const) {
      const source = templates[type];
      const session = new DiagramSession(source);
      session.setParseResult(0, true);
      const result = session.dispatch({ type: 'insert-palette-entry', snippet: type === 'sequence' ? '    participant Cache' : '    section Release' });
      expect(result).toBeDefined();
      expect(result).not.toBe(source);
    }
  });

  it('keeps missing edge deletions as no-ops across editable graph types', () => {
    const diagrams = [
      'flowchart TD\n  A-->B',
      'classDiagram\nclass A\nclass B\nA --> B',
      'stateDiagram-v2\nA --> B',
      'erDiagram\nA ||--o{ B : has',
    ] as const;
    for (const source of diagrams) {
      const session = new DiagramSession(source);
      session.setParseResult(0, true);
      expect(session.dispatch({ type: 'delete-edge', id: 'missing-edge' })).toBeUndefined();
      expect(() => session.dispatch({ type: 'update-edge', id: 'missing-edge', patch: {} })).toThrow('no longer exists');
    }
  });

  it('accepts empty edge patches without changing source for each edge syntax', () => {
    const diagrams = [
      'flowchart TD\n  A-->B',
      'classDiagram\nclass A\nclass B\nA --> B',
      'stateDiagram-v2\nA --> B : next',
      'erDiagram\nA ||--o{ B : has',
    ] as const;
    for (const source of diagrams) {
      const session = new DiagramSession(source);
      session.setParseResult(0, true);
      const edge = session.getSnapshot().model.elements.find((item) => item.kind === 'edge')!;
      expect(session.dispatch({ type: 'update-edge', id: edge.id, patch: {} })).toBeUndefined();
      expect(session.getSnapshot().codeBlock.source).toBe(source);
    }
  });

  it('handles generated identifiers and raw or malformed model identifiers', () => {
    const state = new DiagramSession('stateDiagram-v2\nA --> B');
    state.setParseResult(0, true);
    expect(state.dispatch({ type: 'create-node' })).toMatch(/State[a-z2-9]{9}/);

    const classDiagram = new DiagramSession('classDiagram\nclass A');
    classDiagram.setParseResult(0, true);
    expect(classDiagram.dispatch({ type: 'create-node', empty: true })).toContain('Class-');

    const flowchart = new DiagramSession('flowchart TD\n  A-->B');
    flowchart.setParseResult(0, true);
    expect(flowchart.dispatch({ type: 'update-node', id: 'A', patch: { label: 'Alpha' } })).toContain('Alpha');
    flowchart.setParseResult(flowchart.getSnapshot().codeBlock.revision, true);
    expect(() => flowchart.dispatch({ type: 'update-node', id: 'flowchart:node:%', patch: { label: 'Broken' } })).toThrow();
    expect(() => flowchart.dispatch({ type: 'update-subgraph', id: 'flowchart:subgraph:%', patch: { title: 'Broken' } })).toThrow();

    const unknown = new DiagramSession('');
    unknown.setParseResult(0, false);
    expect(unknown.getSnapshot().model.parseState).toBe('unknown');
  });
});
