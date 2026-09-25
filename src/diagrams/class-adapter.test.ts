import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { SourceDocument } from '../source/source-document';
import { classAdapter } from './class-adapter';
import type { DiagramAdapterContext } from './adapter';

function makeContext(source: string): { context: DiagramAdapterContext; getSource: () => string; selection: () => unknown } {
  const toolbar = document.createElement('div');
  const canvas = document.createElement('div');
  canvas.innerHTML = '<svg><g class="classGroup" id="classId-User"></g><g class="classGroup" id="classId-Account"></g><path class="relationshipLine"></path></svg>';
  const svg = canvas.querySelector('svg')!;
  let value = source;
  let selected: unknown;
  const context: DiagramAdapterContext = {
    diagramType: 'class', toolbar, canvas, svg, sourceDocument: new SourceDocument(value, 'class'),
    applySourceMutation(mutate) {
      try { value = mutate(new SourceDocument(value, 'class')); return true; }
      catch { return false; }
    },
    setSelection(selection) { selected = selection; },
  };
  return { context, getSource: () => value, selection: () => selected };
}

describe('Class adapter', () => {
  it('connects selected classes and exposes relation endpoints for editing', () => {
    const fixture = makeContext('classDiagram\nclass User\nclass Account\n');
    const cleanup = classAdapter.mount(fixture.context);

    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Connect two classes"]')!.click();
    fixture.context.svg.querySelector<SVGGElement>('#classId-User')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.context.svg.querySelector<SVGGElement>('#classId-Account')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.getSource()).toContain('User --> Account');

    cleanup();
    const relationFixture = makeContext(fixture.getSource());
    const relationCleanup = classAdapter.mount(relationFixture.context);
    relationFixture.context.svg.querySelector<SVGPathElement>('.relationshipLine')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(relationFixture.selection()).toEqual({ kind: 'edge', diagramType: 'class', source: 'User', target: 'Account', occurrence: 0 });
    const endpoint = relationFixture.context.toolbar.querySelector<HTMLInputElement>('[aria-label="From class"]')!;
    endpoint.value = 'Admin';
    endpoint.dispatchEvent(new Event('change', { bubbles: true }));
    expect(relationFixture.getSource()).toContain('Admin --> Account');
    relationCleanup();
  });

  it('connects classes by dragging between nodes', () => {
    const fixture = makeContext('classDiagram\nclass User\nclass Account\n');
    const cleanup = classAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('#classId-User')!
      .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
    fixture.context.svg.querySelector<SVGGElement>('#classId-Account')!
      .dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));
    expect(fixture.getSource()).toContain('User --> Account');
    cleanup();
  });

  it('moves a class relationship endpoint by dragging near the path end', () => {
    const fixture = makeContext('classDiagram\nclass User\nclass Account\nclass Admin\nUser --> Account\n');
    const admin = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    admin.classList.add('classGroup');
    admin.setAttribute('id', 'classId-Admin');
    fixture.context.svg.append(admin);
    const path = fixture.context.svg.querySelector<SVGPathElement>('.relationshipLine')!;
    Object.defineProperties(path, {
      getTotalLength: { value: () => 10 },
      getPointAtLength: { value: (length: number) => ({ x: length, y: 0, matrixTransform() { return this; } }) },
      getScreenCTM: { value: () => ({}) },
    });
    const cleanup = classAdapter.mount(fixture.context);
    path.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 0, clientY: 0 }));
    admin.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, button: 0, clientX: 10, clientY: 0 }));
    expect(fixture.getSource()).toContain('Admin --> Account');
    cleanup();
  });

  it('adds a class with an editable member block and removes toolbar controls on cleanup', () => {
    const fixture = makeContext('classDiagram\n');
    const cleanup = classAdapter.mount(fixture.context);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add class"]')!.click();
    expect(fixture.getSource()).toContain('class Class1 {');
    cleanup();
    expect(fixture.context.toolbar.childElementCount).toBe(0);
  });

  it('offers the catalog relation groups and creates an empty class', () => {
    const fixture = makeContext('classDiagram\n');
    const cleanup = classAdapter.mount(fixture.context);
    expect([...fixture.context.toolbar.querySelectorAll('.mve-palette-group h3')].map((heading) => heading.textContent))
      .toEqual(['Class', 'Relations', 'Cardinality']);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add empty class"]')!.click();
    expect(fixture.getSource()).toContain('class Class1');
    expect(fixture.getSource()).not.toContain('class Class1 {');
    cleanup();
  });

  it('creates a valid one-to-many class relation from the palette', async () => {
    const fixture = makeContext('classDiagram\nclass User\nclass Account\n');
    const cleanup = classAdapter.mount(fixture.context);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Use one-to-many relation"]')!.click();
    fixture.context.svg.querySelector<SVGGElement>('#classId-User')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.context.svg.querySelector<SVGGElement>('#classId-Account')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.getSource()).toContain('User "1" --> "0..*" Account');
    mermaid.initialize({ startOnLoad: false });
    await expect(mermaid.parse(fixture.getSource())).resolves.toBeTruthy();
    cleanup();
  });

  it('keeps selection and reports an unsupported class deletion', () => {
    const fixture = makeContext('classDiagram\nclass User\nnote for User\n');
    const cleanup = classAdapter.mount(fixture.context);
    fixture.context.svg.querySelector<SVGGElement>('#classId-User')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'class', id: 'User' });
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Delete class"]')!.click();

    expect(fixture.selection()).toEqual({ kind: 'node', diagramType: 'class', id: 'User' });
    expect(fixture.context.toolbar.querySelector('.mve-class-help')?.textContent).toBe('This class edit could not be applied.');
    cleanup();
  });
});
