import mermaid from 'mermaid';
import PQueue from 'p-queue';

let nextRenderId = 0;
// Mermaid and this queue are shared by imports of this evaluated module copy.
// Keep one queue at module scope so its editor sessions serialize render calls;
// PQueue also lets React cancel requests that are still waiting to start.
const renderQueue = new PQueue({ concurrency: 1 });

export interface RenderedDiagram {
  readonly svg: string;
  readonly diagramType: string;
  readonly bindFunctions?: (element: Element) => void;
}

export class MermaidRendererError extends Error {
  readonly stage: 'parse' | 'render';
  readonly cause: unknown;

  constructor(stage: 'parse' | 'render', cause: unknown) {
    super(cause instanceof Error ? cause.message : 'Mermaid renderer failed.');
    this.name = 'MermaidRendererError';
    this.stage = stage;
    this.cause = cause;
  }
}

function initializeMermaid(): void {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
}

export async function parseMermaid(source: string, signal?: AbortSignal): Promise<void> {
  return renderQueue.add(async () => {
    initializeMermaid();
    await parseSource(source);
  }, signal ? { signal } : {});
}

export async function renderMermaid(source: string, signal?: AbortSignal): Promise<RenderedDiagram> {
  return renderQueue.add(async () => {
    // Reassert strict mode immediately before Mermaid reads the shared config.
    initializeMermaid();
    try {
      const result = await mermaid.render(`mve-${++nextRenderId}`, source);
      return {
        svg: result.svg,
        diagramType: result.diagramType,
        ...(result.bindFunctions ? { bindFunctions: result.bindFunctions } : {}),
      };
    } catch (cause) {
      try {
        await mermaid.parse(source);
      } catch (parseCause) {
        throw new MermaidRendererError('parse', parseCause);
      }
      throw new MermaidRendererError('render', cause);
    }
  }, signal ? { signal } : {});
}

async function parseSource(source: string): Promise<void> {
  try {
    await mermaid.parse(source);
  } catch (cause) {
    throw new MermaidRendererError('parse', cause);
  }
}
