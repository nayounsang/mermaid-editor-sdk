import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { classifyDiagram, withParseResult, withPreviewResult } from './capability';

describe('diagram capability classification', () => {
  it('distinguishes unsupported types and empty input from parse errors', () => {
    const capability = classifyDiagram('architecture');
    expect(capability).toMatchObject({
      diagramType: 'unsupported',
      parse: 'not-checked',
      preview: 'pending',
      editor: 'source-only',
    });
    expect(withParseResult(capability, false)).toMatchObject({ parse: 'invalid', preview: 'unavailable' });
    expect(withPreviewResult(capability, true)).toMatchObject({ parse: 'not-checked', preview: 'unavailable' });
    expect(withPreviewResult(withParseResult(capability, true), true))
      .toMatchObject({ parse: 'valid', preview: 'available', editor: 'source-only' });
    expect(classifyDiagram(undefined).diagramType).toBe('unknown');
  });

  it('maps Mermaid detector IDs to the twelve researched editor capabilities', () => {
    const examples = [
      ['flowchart-v2', 'flowchart'],
      ['flowchart', 'flowchart'],
      ['sequence', 'sequence'],
      ['class', 'class'],
      ['stateDiagram', 'state'],
      ['er', 'er'],
      ['gantt', 'gantt'],
      ['pie', 'pie'],
      ['journey', 'journey'],
      ['mindmap', 'mindmap'],
      ['gitGraph', 'gitgraph'],
      ['timeline', 'timeline'],
      ['quadrantChart', 'quadrant'],
    ] as const;
    for (const [detectedType, expected] of examples) {
      expect(classifyDiagram(detectedType).diagramType).toBe(expected);
    }
  });

  it('maps the actual detector results from the pinned Mermaid release', () => {
    mermaid.initialize({ startOnLoad: false });
    const examples = [
      ['flowchart LR', 'flowchart'],
      ['sequenceDiagram', 'sequence'],
      ['classDiagram', 'class'],
      ['stateDiagram', 'state'],
      ['stateDiagram-v2', 'state'],
      ['erDiagram', 'er'],
      ['gantt', 'gantt'],
      ['pie', 'pie'],
      ['journey', 'journey'],
      ['mindmap', 'mindmap'],
      ['gitGraph', 'gitgraph'],
      ['timeline', 'timeline'],
      ['quadrantChart', 'quadrant'],
      ['architecture-beta', 'unsupported'],
    ] as const;
    for (const [source, expected] of examples) {
      expect(classifyDiagram(mermaid.detectType(source)).diagramType).toBe(expected);
    }
  });
});
