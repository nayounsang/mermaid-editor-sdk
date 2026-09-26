import { registerDiagramAdapter } from './adapter';
import { flowchartAdapter } from './flowchart-adapter';
import { sequenceAdapter } from './sequence-adapter';
import { classAdapter } from './class-adapter';
import { stateAdapter } from './state-adapter';
import { erAdapter } from './er-adapter';
import { ganttAdapter } from './gantt-adapter';
import { pieAdapter } from './pie-adapter';
import { journeyAdapter } from './journey-adapter';
import { mindmapAdapter } from './mindmap-adapter';

let unregisterFlowchart: (() => void) | undefined;
let unregisterSequence: (() => void) | undefined;
let unregisterClass: (() => void) | undefined;
let unregisterState: (() => void) | undefined;
let unregisterER: (() => void) | undefined;
let unregisterGantt: (() => void) | undefined;
let unregisterMindmap: (() => void) | undefined;
let unregisterJourney: (() => void) | undefined;
let unregisterPie: (() => void) | undefined;

export function registerBuiltInAdapters(): void {
  if (!unregisterFlowchart) unregisterFlowchart = registerDiagramAdapter(flowchartAdapter);
  if (!unregisterSequence) unregisterSequence = registerDiagramAdapter(sequenceAdapter);
  if (!unregisterClass) unregisterClass = registerDiagramAdapter(classAdapter);
  if (!unregisterState) unregisterState = registerDiagramAdapter(stateAdapter);
  if (!unregisterER) unregisterER = registerDiagramAdapter(erAdapter);
  if (!unregisterGantt) unregisterGantt = registerDiagramAdapter(ganttAdapter);
  if (!unregisterMindmap) unregisterMindmap = registerDiagramAdapter(mindmapAdapter);
  if (!unregisterJourney) unregisterJourney = registerDiagramAdapter(journeyAdapter);
  if (!unregisterPie) unregisterPie = registerDiagramAdapter(pieAdapter);
}
