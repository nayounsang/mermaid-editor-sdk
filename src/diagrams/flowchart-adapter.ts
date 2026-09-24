import type { DiagramAdapter, DiagramAdapterContext } from './adapter';
import {
  addFlowchartEdge,
  addFlowchartEdgeToSubgraph,
  addFlowchartNode,
  addFlowchartNodeToSubgraph,
  addFlowchartSubgraph,
  addFlowchartSubgraphToSubgraph,
  deleteFlowchartEdge,
  deleteFlowchartNode,
  deleteFlowchartSubgraph,
  getFlowchartEdgeStyle,
  getFlowchartElementStyle,
  isFlowchartEdgeIndexingSafe,
  listFlowchartEdges,
  listFlowchartNodes,
  listFlowchartSubgraphs,
  flowchartSubgraphAt,
  setFlowchartEdge,
  setFlowchartEdgeStyle,
  setFlowchartNode,
  setFlowchartNodeStyle,
  setFlowchartSubgraph,
  type FlowchartEdge,
  type FlowchartNode,
  type FlowchartNodeShape,
  type FlowchartSubgraph,
} from '../source/flowchart-mutations';
import type { EditorSelection } from '../runtime/types';

const SVG_NS = 'http://www.w3.org/2000/svg';

function button(document: Document, text: string, label: string, action: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = text;
  element.setAttribute('aria-label', label);
  element.addEventListener('click', action);
  return element;
}

function field(document: Document, labelText: string, value: string, change: (value: string) => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'mve-flowchart-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const input = document.createElement('input');
  input.value = value;
  input.setAttribute('aria-label', labelText);
  input.addEventListener('change', () => change(input.value));
  label.append(caption, input);
  return label;
}

function selectField<T extends string>(document: Document, labelText: string, choices: readonly T[], value: T, change: (value: T) => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'mve-flowchart-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const select = document.createElement('select');
  select.setAttribute('aria-label', labelText);
  for (const choice of choices) {
    const option = document.createElement('option');
    option.value = choice;
    option.textContent = choice;
    option.selected = choice === value;
    select.append(option);
  }
  select.addEventListener('change', () => change(select.value as T));
  label.append(caption, select);
  return label;
}

function groupIdElement(element: EventTarget | null, selector: string, svg: SVGSVGElement): Element | null {
  if (!(element instanceof Element)) return null;
  const group = element.closest(selector);
  return group && svg.contains(group) ? group : null;
}

function getNodeId(group: Element, nodes: readonly FlowchartNode[], known: ReadonlySet<string>): string | undefined {
  const attrs = [group.getAttribute('data-id'), group.getAttribute('data-node-id'), group.getAttribute('id')].filter(Boolean) as string[];
  for (const raw of attrs) {
    if (known.has(raw)) return raw;
    const rendererId = /(?:^|[-_])flowchart[-_](.+)[-_]\d+$/.exec(raw)?.[1];
    if (rendererId && known.has(rendererId)) return rendererId;
  }
  const label = group.querySelector('.nodeLabel')?.textContent?.trim();
  if (label) {
    const matches = nodes.filter((node) => node.label.trim() === label);
    if (matches.length === 1) return matches[0]!.id;
  }
  return undefined;
}

function getEdge(group: Element, edges: readonly FlowchartEdge[], index: number): FlowchartEdge | undefined {
  const raw = group.getAttribute('id') ?? '';
  const rendererIndex = /[-_](\d+)$/.exec(raw);
  if (rendererIndex) {
    const indexed = edges[Number(rendererIndex[1])];
    if (indexed) return indexed;
  }
  if (edges[index]) return edges[index];
  for (const edge of edges) {
    if (raw.includes(edge.source) && raw.includes(edge.target)) return edge;
    if (raw.includes(edge.target) && raw.includes(edge.source)) return edge;
  }
  return edges[index];
}

function getSubgraph(group: Element, subgraphs: readonly FlowchartSubgraph[]): FlowchartSubgraph | undefined {
  const raw = group.getAttribute('id') ?? '';
  const marker = Math.max(raw.lastIndexOf('subGraph-'), raw.lastIndexOf('subGraph_'), raw.lastIndexOf('cluster-'), raw.lastIndexOf('cluster_'));
  const renderedId = marker >= 0 ? raw.slice(marker).replace(/^(?:subGraph|cluster)[-_]/, '') : raw;
  for (const graph of [...subgraphs].sort((left, right) => right.id.length - left.id.length)) {
    const suffix = renderedId.slice(graph.id.length);
    if (renderedId === graph.id || (renderedId.startsWith(graph.id) && /^[-_]\d+$/.test(suffix))) return graph;
  }
  const title = group.querySelector('.cluster-label')?.textContent?.trim();
  const matches = subgraphs.filter((graph) => graph.title === title);
  return matches.length === 1 ? matches[0] : undefined;
}

function freshId(prefix: string, used: Set<string>): string {
  let index = 1;
  while (used.has(`${prefix}${index}`)) index++;
  return `${prefix}${index}`;
}

function eventNodeId(event: Event, svg: SVGSVGElement, nodeIds: ReadonlyMap<Element, string>): string | undefined {
  const group = groupIdElement(event.target, 'g.node, g.nodes .node', svg);
  return group ? nodeIds.get(group) : undefined;
}

export const flowchartAdapter: DiagramAdapter = {
  diagramType: 'flowchart',
  mount(context: DiagramAdapterContext): () => void {
    const { toolbar, svg, canvas } = context;
    const document = toolbar.ownerDocument;
    const palette = document.createElement('div');
    palette.className = 'mve-flowchart-palette';
    palette.setAttribute('aria-label', 'Flowchart palette');
    const selectionPanel = document.createElement('div');
    selectionPanel.className = 'mve-flowchart-selection';
    selectionPanel.hidden = true;
    const help = document.createElement('span');
    help.className = 'mve-flowchart-help';
    help.textContent = 'Select a node, edge, or subgraph. Hold Shift or drag between nodes to connect them.';
    toolbar.replaceChildren(palette, selectionPanel, help);

    let selected: EditorSelection | null = null;
    let connectionStart: string | undefined;
    let activeConnector = '-->';
    let pointerStart: { id: string; x: number; y: number } | undefined;
    let disposed = false;
    const injected: SVGGElement[] = [];
    const hoverHandlers: Array<{ group: SVGGElement; enter: () => void; leave: (event: PointerEvent) => void }> = [];
    const nodeList = listFlowchartNodes(context.sourceDocument.source);
    const nodeKeys = new Set(nodeList.map((node) => node.id));
    const nodeGroups = [...svg.querySelectorAll<SVGGElement>('g.node, g.nodes .node')];
    const nodeIds = new Map<Element, string>();
    for (const group of nodeGroups) {
      const id = getNodeId(group, nodeList, nodeKeys);
      if (id) nodeIds.set(group, id);
    }
    const edgeList = listFlowchartEdges(context.sourceDocument.source);
    const subgraphList = listFlowchartSubgraphs(context.sourceDocument.source);
    const safeEdges = isFlowchartEdgeIndexingSafe(context.sourceDocument.source);

    const setSelected = (next: EditorSelection | null): void => {
      selected = next;
      context.setSelection(next);
      svg.querySelectorAll('.mve-selected').forEach((element) => element.classList.remove('mve-selected'));
      if (!next) { selectionPanel.hidden = true; selectionPanel.replaceChildren(); return; }
      selectionPanel.hidden = false;
      if (next.kind === 'node') {
        const group = nodeGroups.find((candidate) => nodeIds.get(candidate) === next.id);
        group?.classList.add('mve-selected');
      } else if (next.kind === 'edge') {
        for (const selector of ['g.edgePath', 'g.edgeLabel']) {
          [...svg.querySelectorAll(selector)].forEach((group, index) => {
            const edge = getEdge(group, edgeList, index);
            if (edge?.source === next.source && edge.target === next.target
              && edge.occurrence === (next.occurrence ?? 0)) group.classList.add('mve-selected');
          });
        }
      } else {
        const group = [...svg.querySelectorAll('g.cluster')].find((candidate) => getSubgraph(candidate, subgraphList)?.id === next.id);
        group?.classList.add('mve-selected');
      }
      renderFields();
    };

    const removeSelected = (): void => {
      if (!selected) return;
      const target = selected;
      if (target.kind === 'node') context.applySourceMutation((doc) => deleteFlowchartNode(doc.source, target.id));
      else if (target.kind === 'edge') {
        const edge = edgeList.find((candidate) => candidate.source === target.source && candidate.target === target.target
          && candidate.occurrence === (target.occurrence ?? 0));
        if (edge) context.applySourceMutation((doc) => deleteFlowchartEdge(doc.source, edge));
      } else context.applySourceMutation((doc) => deleteFlowchartSubgraph(doc.source, target.id));
      setSelected(null);
    };

    const renderFields = (): void => {
      selectionPanel.replaceChildren();
      const current = selected;
      if (!current) return;
      if (current.kind === 'node') {
        const node = nodeList.find((candidate) => candidate.id === current.id);
        if (!node) return;
        selectionPanel.append(
          field(document, 'Node ID', node.id, (id) => context.applySourceMutation((doc) => setFlowchartNode(doc.source, node.id, { id }))),
          field(document, 'Label', node.label, (label) => context.applySourceMutation((doc) => setFlowchartNode(doc.source, node.id, { label }))),
          selectField(document, 'Shape', ['rect', 'round', 'diamond', 'circle', 'stadium', 'subroutine', 'database', 'hexagon'] as const,
            node.shape === 'bare' ? 'rect' : node.shape, (shape) =>
            context.applySourceMutation((doc) => setFlowchartNode(doc.source, node.id, { shape }))),
          field(document, 'Fill', getFlowchartElementStyle(context.sourceDocument.source, node.id, 'fill'), (fill) => context.applySourceMutation((doc) => setFlowchartNodeStyle(doc.source, node.id, 'fill', fill))),
          field(document, 'Stroke', getFlowchartElementStyle(context.sourceDocument.source, node.id, 'stroke'), (stroke) => context.applySourceMutation((doc) => setFlowchartNodeStyle(doc.source, node.id, 'stroke', stroke))),
          button(document, 'Delete', 'Delete node', removeSelected),
        );
      } else if (current.kind === 'edge') {
        const edge = edgeList.find((candidate) => candidate.source === current.source && candidate.target === current.target
          && candidate.occurrence === (current.occurrence ?? 0));
        if (!edge) return;
        selectionPanel.append(
          field(document, 'From', edge.source, (source) => context.applySourceMutation((doc) => setFlowchartEdge(doc.source, edge, { source }))),
          field(document, 'To', edge.target, (target) => context.applySourceMutation((doc) => setFlowchartEdge(doc.source, edge, { target }))),
          field(document, 'Label', edge.label, (label) => context.applySourceMutation((doc) => setFlowchartEdge(doc.source, edge, { label }))),
          selectField(document, 'Line', ['-->', '---', '-.->', '==>', '<--', '<-->'] as const, edge.operator as '-->', (operator) =>
            context.applySourceMutation((doc) => setFlowchartEdge(doc.source, edge, { operator }))),
          field(document, 'Stroke', getFlowchartEdgeStyle(context.sourceDocument.source, edge, 'stroke'), (stroke) => context.applySourceMutation((doc) => setFlowchartEdgeStyle(doc.source, edge, stroke))),
          button(document, 'Delete', 'Delete edge', removeSelected),
        );
      } else {
        const graph = subgraphList.find((candidate) => candidate.id === current.id);
        if (!graph) return;
        selectionPanel.append(
          field(document, 'Subgraph ID', graph.id, (id) => context.applySourceMutation((doc) => setFlowchartSubgraph(doc.source, graph.id, { id }))),
          field(document, 'Title', graph.title, (title) => context.applySourceMutation((doc) => setFlowchartSubgraph(doc.source, graph.id, { title }))),
          field(document, 'Fill', getFlowchartElementStyle(context.sourceDocument.source, graph.id, 'fill'), (fill) => context.applySourceMutation((doc) => setFlowchartSubgraph(doc.source, graph.id, { fill }))),
          field(document, 'Stroke', getFlowchartElementStyle(context.sourceDocument.source, graph.id, 'stroke'), (stroke) => context.applySourceMutation((doc) => setFlowchartSubgraph(doc.source, graph.id, { stroke }))),
          button(document, 'Delete', 'Delete subgraph', removeSelected),
        );
      }
    };

    const addNode = (shape: FlowchartNodeShape = 'rect', from?: string, targetSubgraph?: string): void => {
      const currentSource = context.sourceDocument.source;
      const used = new Set([
        ...listFlowchartNodes(currentSource).map((node) => node.id),
        ...listFlowchartSubgraphs(currentSource).map((graph) => graph.id),
      ]);
      const id = freshId('N', used);
      const label = ({ rect: 'Process box', diamond: 'Decision', round: 'Rounded', circle: 'Circle', stadium: 'Stadium',
        subroutine: 'Subroutine', database: 'Database', hexagon: 'Hexagon', bare: id } satisfies Record<FlowchartNodeShape, string>)[shape];
      context.applySourceMutation((doc) => {
        const withNode = targetSubgraph
          ? addFlowchartNodeToSubgraph(doc.source, targetSubgraph, id, label, shape)
          : addFlowchartNode(doc.source, id, label, shape);
        return from
          ? targetSubgraph
            ? addFlowchartEdgeToSubgraph(withNode, targetSubgraph, from, id, activeConnector)
            : addFlowchartEdge(withNode, from, id, activeConnector)
          : withNode;
      });
    };

    const armConnection = (): void => {
      connectionStart = '';
      help.textContent = `Choose two nodes to connect with ${activeConnector}.`;
    };
    const armConnector = (operator: string): void => {
      activeConnector = operator;
      armConnection();
    };
    const beginPaletteDrag = (element: HTMLButtonElement, kind: string, value: string): void => {
      element.draggable = true;
      element.addEventListener('dragstart', (event) => {
        event.dataTransfer?.setData('application/x-mve-flowchart-palette', JSON.stringify({ kind, value }));
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
      });
    };
    const paletteNodes: Array<[string, FlowchartNodeShape]> = [
      ['Process box', 'rect'], ['Decision', 'diamond'], ['Rounded', 'round'], ['Circle', 'circle'],
      ['Stadium', 'stadium'], ['Subroutine', 'subroutine'], ['Database', 'database'], ['Hexagon', 'hexagon'],
    ];
    for (const [label, shape] of paletteNodes) {
      const item = button(document, `+ ${label}`, `Add ${label.toLowerCase()}`, () => addNode(shape));
      beginPaletteDrag(item, 'node', shape);
      palette.append(item);
    }
    const subgraphItem = button(document, '+ Subgraph', 'Add subgraph', () => {
      const currentSource = context.sourceDocument.source;
      const used = new Set([
        ...listFlowchartSubgraphs(currentSource).map((graph) => graph.id),
        ...listFlowchartNodes(currentSource).map((node) => node.id),
      ]);
      const id = freshId('SG', used);
      context.applySourceMutation((doc) => addFlowchartSubgraph(doc.source, id, `Group ${id.slice(2)}`));
    });
    beginPaletteDrag(subgraphItem, 'subgraph', '');
    palette.append(subgraphItem);
    if (safeEdges) {
      palette.append(button(document, 'Connect nodes', 'Connect two nodes', armConnection));
      for (const [label, operator] of [['Arrow', '-->'], ['Line', '---'], ['Dotted arrow', '-.->'], ['Thick arrow', '==>']] as const) {
        const connector = button(document, label, `Use ${label.toLowerCase()} connector`, () => armConnector(operator));
        beginPaletteDrag(connector, 'connector', operator);
        palette.append(connector);
      }
    }

    const dragOver = (event: DragEvent): void => {
      if (event.dataTransfer?.types.includes('application/x-mve-flowchart-palette')) event.preventDefault();
    };
    const drop = (event: DragEvent): void => {
      const payload = event.dataTransfer?.getData('application/x-mve-flowchart-palette');
      if (!payload) return;
      event.preventDefault();
      let item: { kind: string; value: string };
      try { item = JSON.parse(payload) as { kind: string; value: string }; } catch { return; }
      const targetNodeGroup = groupIdElement(event.target, 'g.node, g.nodes .node', svg);
      const targetNodeId = targetNodeGroup ? nodeIds.get(targetNodeGroup) : undefined;
      const targetCluster = groupIdElement(event.target, 'g.cluster', svg);
      const targetGraph = targetCluster
        ? getSubgraph(targetCluster, listFlowchartSubgraphs(context.sourceDocument.source))
        : targetNodeId
          ? (() => {
            const node = listFlowchartNodes(context.sourceDocument.source).find((candidate) => candidate.id === targetNodeId);
            return node ? flowchartSubgraphAt(context.sourceDocument.source, node.lineStart) : undefined;
          })()
          : undefined;
      if (item.kind === 'node') {
        const shape = item.value as FlowchartNodeShape;
        if (!paletteNodes.some(([, candidate]) => candidate === shape)) return;
        addNode(shape, targetNodeId, targetGraph?.id);
      } else if (item.kind === 'subgraph') {
        const currentSource = context.sourceDocument.source;
        const used = new Set([...listFlowchartSubgraphs(currentSource).map((graph) => graph.id), ...listFlowchartNodes(currentSource).map((node) => node.id)]);
        const id = freshId('SG', used);
        context.applySourceMutation((doc) => targetGraph
          ? addFlowchartSubgraphToSubgraph(doc.source, targetGraph.id, id, `Group ${id.slice(2)}`)
          : addFlowchartSubgraph(doc.source, id, `Group ${id.slice(2)}`));
      } else if (item.kind === 'connector' && safeEdges) armConnector(item.value);
    };
    svg.addEventListener('dragover', dragOver);
    svg.addEventListener('drop', drop);

    const click = (event: MouseEvent): void => {
      const nodeGroup = groupIdElement(event.target, 'g.node, g.nodes .node', svg);
      const nodeId = nodeGroup ? nodeIds.get(nodeGroup) : undefined;
      if (nodeId && safeEdges && (event.shiftKey || connectionStart !== undefined)) {
        if (!connectionStart) { connectionStart = nodeId; help.textContent = `Choose a target for ${nodeId}.`; }
        else if (connectionStart !== nodeId) {
          const from = connectionStart;
          connectionStart = undefined;
          context.applySourceMutation((doc) => addFlowchartEdge(doc.source, from, nodeId, activeConnector));
          activeConnector = '-->';
          help.textContent = 'Select a node, edge, or subgraph. Hold Shift or drag between nodes to connect them.';
        }
        event.preventDefault();
        return;
      }
      if (nodeId) { setSelected({ kind: 'node', diagramType: 'flowchart', id: nodeId }); return; }
      if (safeEdges) {
        const group = groupIdElement(event.target, 'g.edgePath, g.edgeLabel', svg);
        if (group) {
          const selector = group.matches('g.edgePath') ? 'g.edgePath' : 'g.edgeLabel';
          const groups = [...svg.querySelectorAll(selector)];
          const edge = getEdge(group, listFlowchartEdges(context.sourceDocument.source), groups.indexOf(group));
          if (edge) setSelected({ kind: 'edge', diagramType: 'flowchart', source: edge.source, target: edge.target, occurrence: edge.occurrence });
          return;
        }
      }
      const cluster = groupIdElement(event.target, 'g.cluster', svg);
      const graph = cluster ? getSubgraph(cluster, listFlowchartSubgraphs(context.sourceDocument.source)) : undefined;
      if (graph) setSelected({ kind: 'subgraph', diagramType: 'flowchart', id: graph.id, title: graph.title });
      else setSelected(null);
    };

    const doubleClick = (event: MouseEvent): void => {
      click(event);
      if (selected) {
        event.preventDefault();
        selectionPanel.querySelector<HTMLInputElement>('input')?.focus();
      }
    };
    const pointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) return;
      const id = eventNodeId(event, svg, nodeIds);
      pointerStart = id ? { id, x: event.clientX, y: event.clientY } : undefined;
    };
    const pointerUp = (event: PointerEvent): void => {
      const target = eventNodeId(event, svg, nodeIds);
      const moved = pointerStart && (event.clientX - pointerStart.x) ** 2 + (event.clientY - pointerStart.y) ** 2 >= 25;
      if (pointerStart && moved && target && pointerStart.id !== target && safeEdges) {
        const from = pointerStart.id;
        context.applySourceMutation((doc) => addFlowchartEdge(doc.source, from, target, activeConnector));
        activeConnector = '-->';
      }
      pointerStart = undefined;
    };
    const keyDown = (event: KeyboardEvent): void => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selected
        && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLSelectElement)) {
        event.preventDefault();
        removeSelected();
      }
    };

    for (const group of nodeGroups) {
      const id = nodeIds.get(group);
      if (!id) continue;
      try {
        const box = group.getBBox();
        const overlay = document.createElementNS(SVG_NS, 'g');
        overlay.classList.add('mve-node-plus-overlay');
        const plus = document.createElementNS(SVG_NS, 'g');
        plus.classList.add('mve-node-plus');
        plus.setAttribute('tabindex', '0');
        plus.setAttribute('role', 'button');
        plus.setAttribute('aria-label', `Choose shape for node connected to ${id}`);
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', String(box.x + box.width / 2));
        circle.setAttribute('cy', String(box.y + box.height + 16));
        circle.setAttribute('r', '10');
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(box.x + box.width / 2));
        text.setAttribute('y', String(box.y + box.height + 21));
        text.setAttribute('text-anchor', 'middle');
        text.textContent = '+';
        plus.append(circle, text);
        const menu = document.createElementNS(SVG_NS, 'g');
        menu.classList.add('mve-node-shape-menu');
        menu.setAttribute('aria-label', `Choose shape connected to ${id}`);
        menu.setAttribute('transform', `translate(${box.x + box.width / 2 - 134} ${box.y + box.height + 34})`);
        const choices: Array<[string, FlowchartNodeShape]> = [['Process', 'rect'], ['Rounded', 'round'], ['Circle', 'circle'], ['Decision', 'diamond']];
        choices.forEach(([label, shape], index) => {
          const choice = document.createElementNS(SVG_NS, 'g');
          choice.classList.add('mve-node-shape-choice');
          choice.setAttribute('tabindex', '0');
          choice.setAttribute('role', 'button');
          choice.setAttribute('aria-label', `Add ${label.toLowerCase()} node connected to ${id}`);
          choice.setAttribute('transform', `translate(${index * 68} 0)`);
          const background = document.createElementNS(SVG_NS, 'rect');
          background.setAttribute('width', '64');
          background.setAttribute('height', '26');
          background.setAttribute('rx', '4');
          const caption = document.createElementNS(SVG_NS, 'text');
          caption.setAttribute('x', '32');
          caption.setAttribute('y', '17');
          caption.setAttribute('text-anchor', 'middle');
          caption.textContent = label;
          choice.append(background, caption);
          const selectShape = (event: Event): void => {
            event.preventDefault();
            event.stopPropagation();
            if (disposed) return;
            const node = listFlowchartNodes(context.sourceDocument.source).find((candidate) => candidate.id === id);
            const parent = node ? flowchartSubgraphAt(context.sourceDocument.source, node.lineStart)?.id : undefined;
            addNode(shape, id, parent);
          };
          choice.addEventListener('click', selectShape);
          choice.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') selectShape(event); });
          menu.append(choice);
        });
        const toggleMenu = (event: Event): void => {
          event.preventDefault();
          event.stopPropagation();
          const opening = !menu.classList.contains('mve-open');
          svg.querySelectorAll('.mve-node-shape-menu.mve-open').forEach((element) => element.classList.remove('mve-open'));
          if (opening) menu.classList.add('mve-open');
        };
        plus.addEventListener('click', toggleMenu);
        plus.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') toggleMenu(event); });
        const enter = (): void => plus.classList.add('mve-visible');
        const leave = (event: PointerEvent): void => {
          if (event.relatedTarget instanceof Node && overlay.contains(event.relatedTarget)) return;
          plus.classList.remove('mve-visible');
        };
        group.addEventListener('pointerenter', enter);
        group.addEventListener('pointerleave', leave);
        hoverHandlers.push({ group, enter, leave });
        overlay.append(plus, menu);
        overlay.addEventListener('pointerenter', enter);
        overlay.addEventListener('pointerleave', leave);
        hoverHandlers.push({ group: overlay, enter, leave });
        svg.append(overlay);
        injected.push(overlay);
      } catch {
        // jsdom and some SVG implementations do not expose getBBox; selection still works.
      }
    }

    svg.addEventListener('click', click);
    svg.addEventListener('dblclick', doubleClick);
    svg.addEventListener('pointerdown', pointerDown);
    svg.addEventListener('pointerup', pointerUp);
    svg.addEventListener('keydown', keyDown);
    canvas.addEventListener('keydown', keyDown);
    return () => {
      disposed = true;
      svg.removeEventListener('click', click);
      svg.removeEventListener('dblclick', doubleClick);
      svg.removeEventListener('pointerdown', pointerDown);
      svg.removeEventListener('pointerup', pointerUp);
      svg.removeEventListener('dragover', dragOver);
      svg.removeEventListener('drop', drop);
      svg.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('keydown', keyDown);
      for (const handlers of hoverHandlers) {
        handlers.group.removeEventListener('pointerenter', handlers.enter);
        handlers.group.removeEventListener('pointerleave', handlers.leave);
      }
      for (const plus of injected) plus.remove();
      injected.length = 0;
    };
  },
};
