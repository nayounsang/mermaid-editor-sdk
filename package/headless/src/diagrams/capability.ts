/** Diagram categories detected by the SDK, including unsupported and unknown sources. */
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

/** Editing and preview capabilities for a detected diagram. */
export interface DiagramCapability {
  /** Detected diagram category. */
  diagramType: DiagramType;
  /** Parse validation status. */
  parse: 'not-checked' | 'valid' | 'invalid';
  /** Preview availability status. */
  preview: 'pending' | 'available' | 'unavailable';
  /** Available editing mode. */
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

/** Classifies a detected Mermaid diagram name.
 * @param detectedType - Mermaid diagram name detected from the source, if any.
 */
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

/** Returns a capability value updated with a parse result.
 * @param capability - Capability value to update.
 * @param valid - Whether parsing succeeded.
 */
export function withParseResult(capability: DiagramCapability, valid: boolean): DiagramCapability {
  return {
    ...capability,
    parse: valid ? 'valid' : 'invalid',
    preview: valid ? capability.preview : 'unavailable',
  };
}

/** Returns a capability value updated with preview availability.
 * @param capability - Capability value to update.
 * @param available - Whether a preview can be rendered.
 */
export function withPreviewResult(capability: DiagramCapability, available: boolean): DiagramCapability {
  return {
    ...capability,
    preview: available && capability.parse === 'valid' ? 'available' : 'unavailable',
  };
}
