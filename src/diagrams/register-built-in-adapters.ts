import { registerDiagramAdapter } from './adapter';
import { flowchartAdapter } from './flowchart-adapter';

let unregisterFlowchart: (() => void) | undefined;

export function registerBuiltInAdapters(): void {
  if (!unregisterFlowchart) unregisterFlowchart = registerDiagramAdapter(flowchartAdapter);
}
