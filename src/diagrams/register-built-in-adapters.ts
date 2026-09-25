import { registerDiagramAdapter } from './adapter';
import { flowchartAdapter } from './flowchart-adapter';
import { sequenceAdapter } from './sequence-adapter';
import { classAdapter } from './class-adapter';
import { stateAdapter } from './state-adapter';
import { erAdapter } from './er-adapter';

let unregisterFlowchart: (() => void) | undefined;
let unregisterSequence: (() => void) | undefined;
let unregisterClass: (() => void) | undefined;
let unregisterState: (() => void) | undefined;
let unregisterER: (() => void) | undefined;

export function registerBuiltInAdapters(): void {
  if (!unregisterFlowchart) unregisterFlowchart = registerDiagramAdapter(flowchartAdapter);
  if (!unregisterSequence) unregisterSequence = registerDiagramAdapter(sequenceAdapter);
  if (!unregisterClass) unregisterClass = registerDiagramAdapter(classAdapter);
  if (!unregisterState) unregisterState = registerDiagramAdapter(stateAdapter);
  if (!unregisterER) unregisterER = registerDiagramAdapter(erAdapter);
}
