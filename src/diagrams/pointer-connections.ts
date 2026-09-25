const SVG_NS = 'http://www.w3.org/2000/svg';
type EdgeEndpoint = 'source' | 'target';
interface EdgeTarget {
  path: SVGPathElement;
  source: string;
  target: string;
  reconnect: (endpoint: EdgeEndpoint, nodeId: string) => void;
}

export function installPointerConnections(
  svg: SVGSVGElement,
  nodeAt: (target: EventTarget | null) => { id: string; element: Element } | undefined,
  connect: (from: string, to: string) => void,
  edgeAt?: (target: EventTarget | null) => EdgeTarget | undefined,
): () => void {
  let start: { kind: 'node'; id: string; x: number; y: number }
    | { kind: 'edge'; edge: EdgeTarget; endpoint: EdgeEndpoint; x: number; y: number }
    | undefined;
  let line: SVGLineElement | undefined;
  let target: Element | undefined;

  const clear = (): void => {
    start = undefined;
    line?.remove();
    line = undefined;
    target?.classList.remove('mve-drop-target');
    target = undefined;
  };
  const down = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const node = nodeAt(event.target);
    if (node) {
      start = { kind: 'node', id: node.id, x: event.clientX, y: event.clientY };
      return;
    }
    const edge = edgeAt?.(event.target);
    if (!edge || typeof edge.path.getTotalLength !== 'function') return;
    try {
      const length = edge.path.getTotalLength();
      const matrix = edge.path.getScreenCTM();
      if (!matrix) return;
      const first = edge.path.getPointAtLength(0).matrixTransform(matrix);
      const last = edge.path.getPointAtLength(length).matrixTransform(matrix);
      const firstDistance = Math.hypot(first.x - event.clientX, first.y - event.clientY);
      const lastDistance = Math.hypot(last.x - event.clientX, last.y - event.clientY);
      if (Math.min(firstDistance, lastDistance) <= 24) start = {
        kind: 'edge', edge, endpoint: firstDistance < lastDistance ? 'source' : 'target',
        x: event.clientX, y: event.clientY,
      };
    } catch { /* The renderer may not expose path geometry. */ }
  };
  const move = (event: PointerEvent): void => {
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) return;
    const matrix = svg.getScreenCTM();
    if (matrix && typeof svg.createSVGPoint === 'function') {
      const point = svg.createSVGPoint();
      const toSvg = (x: number, y: number): SVGPoint => {
        point.x = x;
        point.y = y;
        return point.matrixTransform(matrix.inverse());
      };
      const from = toSvg(start.x, start.y);
      const to = toSvg(event.clientX, event.clientY);
      if (!line) {
        line = svg.ownerDocument.createElementNS(SVG_NS, 'line');
        line.classList.add('mve-connection-preview');
        svg.append(line);
      }
      line.setAttribute('x1', String(from.x));
      line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(to.x));
      line.setAttribute('y2', String(to.y));
    }
    target?.classList.remove('mve-drop-target');
    const candidate = nodeAt(event.target);
    target = candidate && (start.kind === 'node' ? candidate.id !== start.id
      : candidate.id !== start.edge[start.endpoint] && candidate.id !== start.edge[start.endpoint === 'source' ? 'target' : 'source'])
      ? candidate.element : undefined;
    target?.classList.add('mve-drop-target');
  };
  const up = (event: PointerEvent): void => {
    const origin = start;
    const destination = nodeAt(event.target);
    const moved = origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >= 5;
    clear();
    if (!origin || !moved || !destination) return;
    if (origin.kind === 'node' && origin.id !== destination.id) connect(origin.id, destination.id);
    else if (origin.kind === 'edge' && destination.id !== origin.edge[origin.endpoint]
      && destination.id !== origin.edge[origin.endpoint === 'source' ? 'target' : 'source']) {
      origin.edge.reconnect(origin.endpoint, destination.id);
    }
  };
  svg.addEventListener('pointerdown', down);
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', clear);
  return () => {
    svg.removeEventListener('pointerdown', down);
    svg.removeEventListener('pointermove', move);
    svg.removeEventListener('pointerup', up);
    svg.removeEventListener('pointercancel', clear);
    clear();
  };
}
