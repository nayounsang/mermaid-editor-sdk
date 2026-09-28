import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { SourceDocument } from '@mermaid-editor-sdk/headless';
import { erAdapter } from './er-adapter';
import type { DiagramAdapterContext } from './adapter';

function makeContext(source: string, svgMarkup = '<g class="node" id="diagram-id-entity-A-0"></g><g class="node" id="diagram-id-entity-B-1"></g><path class="relationshipLine"></path>') {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = svgMarkup.trimStart().startsWith('<svg') ? svgMarkup : `<svg>${svgMarkup}</svg>`;
  const svg = canvas.querySelector('svg')!;
  let value = source;
  let selected: unknown;
  const context: DiagramAdapterContext = {
    diagramType: 'er', toolbar, canvas, svg, sourceDocument: new SourceDocument(value, 'er'),
    applySourceMutation(mutate) {
      try { value = mutate(new SourceDocument(value, 'er')); return true; }
      catch { return false; }
    },
    setSelection(selection) { selected = selection; },
  };
  return { context, getSource: () => value, selection: () => selected };
}

async function makeRenderedContext(source: string, id: string) {
  const getBBox = Object.getOwnPropertyDescriptor(SVGElement.prototype, 'getBBox');
  Object.defineProperty(SVGElement.prototype, 'getBBox', {
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 80, height: 36 }),
  });
  try {
    mermaid.initialize({ startOnLoad: false });
    const rendered = await mermaid.render(id, source);
    return makeContext(source, rendered.svg);
  } finally {
    if (getBBox) Object.defineProperty(SVGElement.prototype, 'getBBox', getBBox);
    else delete (SVGElement.prototype as SVGElement & { getBBox?: () => DOMRect }).getBBox;
  }
}

describe('ER adapter', () => {
  it('connects selected entities with configured cardinality and line style, then reports selection', () => {
    const fixture = makeContext('erDiagram\nA ||--o{ B : existing\n');
    const cleanup = erAdapter.mount(fixture.context);
    const cardinality = fixture.context.toolbar.querySelector<HTMLSelectElement>('[aria-label="New relationship cardinality"]')!;
    cardinality.value = 'many-many';
    cardinality.dispatchEvent(new Event('change', { bubbles: true }));
    const line = fixture.context.toolbar.querySelector<HTMLSelectElement>('[aria-label="New relationship line"]')!;
    line.value = 'non-identifying';
    line.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Connect two entities"]')!.click();
    fixture.context.svg.querySelector<SVGGElement>('#diagram-id-entity-A-0')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.context.svg.querySelector<SVGGElement>('#diagram-id-entity-B-1')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.getSource()).toContain('A }o..o{ B : relates');
    fixture.context.svg.querySelector<SVGPathElement>('.relationshipLine')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'er', source: 'A', target: 'B', occurrence: 0 });
    cleanup();
    expect(fixture.context.toolbar.childElementCount).toBe(0);
    expect(fixture.selection()).toBeNull();
  });

  it('connects entities by dragging between nodes', () => {
    const fixture = makeContext('erDiagram\nA ||--o{ B : existing\n');
    const cleanup = erAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('#diagram-id-entity-A-0')!
      .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
    fixture.context.svg.querySelector<SVGGElement>('#diagram-id-entity-B-1')!
      .dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));
    expect(fixture.getSource()).toContain('A ||--o{ B : relates');
    cleanup();
  });

  it('adds an entity from the toolbar', () => {
    const fixture = makeContext('erDiagram\nA ||--o{ B : related\n');
    const cleanup = erAdapter.mount(fixture.context);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add entity"]')!.click();
    expect(fixture.getSource()).toContain('Entity1 {\n  string attribute1\n}\n');
    cleanup();
  });

  it('selects entities from the pinned Mermaid renderer and updates an attribute', async () => {
    const source = 'erDiagram\nCUSTOMER {\n  string id PK "main key"\n}\nCUSTOMER ||--o{ ORDER : places\nORDER {\n  int id PK\n}\n';
    const fixture = await makeRenderedContext(source, 'er-entity-selection');
    const cleanup = erAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('[id$="-entity-CUSTOMER-0"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'er', id: 'CUSTOMER' });
    const input = fixture.context.toolbar.querySelector<HTMLInputElement>('[aria-label="Attribute type"]')!;
    input.value = 'varchar(64)';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.getSource()).toContain('varchar(64) id PK "main key"');
    cleanup();
  });

  it('selects a rendered ER relationship and edits its label and cardinality', async () => {
    const source = 'erDiagram\nCUSTOMER ||--o{ ORDER : places\nCUSTOMER {\n  string id PK\n}\nORDER {\n  int id PK\n}\n';
    const fixture = await makeRenderedContext(source, 'er-edge-selection');
    const cleanup = erAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGPathElement>('path.relationshipLine')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'edge', diagramType: 'er', source: 'CUSTOMER', target: 'ORDER', occurrence: 0 });
    const label = fixture.context.toolbar.querySelector<HTMLTextAreaElement>('[aria-label="Relationship label"]')!;
    label.value = 'owns orders';
    label.dispatchEvent(new Event('change', { bubbles: true }));
    const cardinality = fixture.context.toolbar.querySelector<HTMLSelectElement>('[aria-label="Cardinality"]')!;
    cardinality.value = 'zero-one';
    cardinality.dispatchEvent(new Event('change', { bubbles: true }));
    const line = fixture.context.toolbar.querySelector<HTMLSelectElement>('[aria-label="Relationship line"]')!;
    line.value = 'non-identifying';
    line.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.getSource()).toContain('CUSTOMER |o..|| ORDER : "owns orders"');
    cleanup();
  });

  it('edits a selected relationship endpoint through the toolbar', async () => {
    const source = 'erDiagram\nCUSTOMER ||--o{ ORDER : places\nCUSTOMER {\n  string id PK\n}\nORDER {\n  int id PK\n}\nLINE_ITEM {\n  int id PK\n}\n';
    const fixture = await makeRenderedContext(source, 'er-endpoint-edit');
    const cleanup = erAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGPathElement>('path.relationshipLine')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const endpoint = fixture.context.toolbar.querySelector<HTMLInputElement>('[aria-label="To entity"]')!;
    endpoint.value = 'LINE_ITEM';
    endpoint.dispatchEvent(new Event('change', { bubbles: true }));
    expect(fixture.getSource()).toContain('CUSTOMER ||--o{ LINE_ITEM : places');
    cleanup();
  });

  it('maps a quoted entity name from Mermaid’s rendered SVG', async () => {
    const source = 'erDiagram\n"Order Detail" ||--o{ Product : contains\nProduct {\n  int id PK\n}\n';
    const fixture = await makeRenderedContext(source, 'er-quoted-entity');
    const cleanup = erAdapter.mount(fixture.context);
    const group = fixture.context.svg.querySelector<SVGGElement>('g.node[id*="Order Detail"]');
    expect(group).not.toBeNull();
    group!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'er', id: 'Order Detail' });
    cleanup();
  });

  it('reports null when the user clicks the empty canvas to clear a selection', async () => {
    const fixture = await makeRenderedContext('erDiagram\nA ||--o{ B : related\n', 'er-clear-selection');
    const cleanup = erAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('[id$="-entity-A-0"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'er', id: 'A' });
    fixture.context.svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toBeNull();
    cleanup();
  });

  it('does not map canonical relationship paths by index when alias cardinality is present', async () => {
    const source = 'erDiagram\nA zero or one optionally to one or many B : alias\nC ||--o{ D : canonical\n';
    const fixture = await makeRenderedContext(source, 'er-alias-cardinality-selection');
    const cleanup = erAdapter.mount(fixture.context);
    const paths = fixture.context.svg.querySelectorAll<SVGPathElement>('path.relationshipLine');
    expect(paths.length).toBeGreaterThan(1);
    paths[1]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toBeUndefined();
    expect(fixture.context.toolbar.textContent).toContain('unsupported relationship syntax');
    cleanup();
  });
});
