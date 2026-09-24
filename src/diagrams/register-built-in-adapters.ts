import { registerDiagramAdapter } from './adapter';
import { flowchartAdapter } from './flowchart-adapter';
import { sequenceAdapter } from './sequence-adapter';

let unregisterFlowchart: (() => void) | undefined;
let unregisterSequence: (() => void) | undefined;

export function registerBuiltInAdapters(): void {
  if (!unregisterFlowchart) unregisterFlowchart = registerDiagramAdapter(flowchartAdapter);
  if (!unregisterSequence) unregisterSequence = registerDiagramAdapter(sequenceAdapter);
}
