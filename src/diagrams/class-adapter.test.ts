import { describe, expect, it } from 'vitest';
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

  it('adds a class with an editable member block and removes toolbar controls on cleanup', () => {
    const fixture = makeContext('classDiagram\n');
    const cleanup = classAdapter.mount(fixture.context);
    fixture.context.toolbar.querySelector<HTMLButtonElement>('[aria-label="Add class"]')!.click();
    expect(fixture.getSource()).toContain('class Class1 {');
    cleanup();
    expect(fixture.context.toolbar.childElementCount).toBe(0);
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
