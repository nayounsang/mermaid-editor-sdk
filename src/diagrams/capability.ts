export type DiagramType =
  | 'flowchart'
  | 'sequence'
  | 'class'
  | 'state'
  | 'er'
  | 'gantt'
  | 'pie'
  | 'journey'
  | 'mindmap'
  | 'gitgraph'
  | 'timeline'
  | 'quadrant'
  | 'unsupported'
  | 'unknown';

export interface DiagramCapability {
  diagramType: DiagramType;
  parse: 'not-checked' | 'valid' | 'invalid';
  preview: 'pending' | 'available' | 'unavailable';
  editor: 'source-only' | 'visual';
}

const knownDiagramTypes: Record<string, DiagramType> = {
  flowchart: 'flowchart',
  'flowchart-v2': 'flowchart',
  sequence: 'sequence',
  class: 'class',
  classDiagram: 'class',
  'classDiagram-v2': 'class',
  state: 'state',
  stateDiagram: 'state',
  er: 'er',
  gantt: 'gantt',
  pie: 'pie',
  journey: 'journey',
  mindmap: 'mindmap',
  gitGraph: 'gitgraph',
  timeline: 'timeline',
  quadrantChart: 'quadrant',
};

export function classifyDiagram(detectedType: string | undefined): DiagramCapability {
  const diagramType = detectedType === undefined
    ? 'unknown'
    : knownDiagramTypes[detectedType] ?? 'unsupported';
  return {
    diagramType,
    parse: 'not-checked',
    preview: 'pending',
    // A diagram remains source-only until its adapter is registered.
    editor: 'source-only',
  };
}

export function withParseResult(capability: DiagramCapability, valid: boolean): DiagramCapability {
  return {
    ...capability,
    parse: valid ? 'valid' : 'invalid',
    preview: valid ? capability.preview : 'unavailable',
  };
}

export function withPreviewResult(capability: DiagramCapability, available: boolean): DiagramCapability {
  return {
    ...capability,
    preview: available && capability.parse === 'valid' ? 'available' : 'unavailable',
  };
}
