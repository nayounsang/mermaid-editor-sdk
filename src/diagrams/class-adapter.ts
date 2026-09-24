import type { DiagramAdapter, DiagramAdapterContext } from './adapter';
import {
  addClassMember,
  addClassNode,
  addClassRelation,
  deleteClassNode,
  deleteClassRelation,
  getClassStyle,
  listClassIds,
  listClassMembers,
  listClassRelations,
  renameClassNode,
  setClassMember,
  setClassStyle,
  setClassRelation,
  type ClassRelation,
  type ClassRelationOperator,
} from '../source/class-mutations';
import type { EditorSelection } from '../runtime/types';

const relationOperators: readonly ClassRelationOperator[] = [
  '<|--', '--|>', '*--', '--*', 'o--', '--o', '<--', '-->', '<|..', '..|>', '<..', '..>', '--', '..',
];

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
  label.className = 'mve-class-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const input = document.createElement('input');
  input.value = value;
  input.setAttribute('aria-label', labelText);
  input.addEventListener('change', () => change(input.value));
  label.append(caption, input);
  return label;
}

function operatorField(document: Document, value: ClassRelationOperator, change: (value: ClassRelationOperator) => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'mve-class-field';
  const caption = document.createElement('span');
  caption.textContent = 'Relationship';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Relationship');
  for (const operator of relationOperators) {
    const option = document.createElement('option');
    option.value = operator;
    option.textContent = operator;
    option.selected = operator === value;
    select.append(option);
  }
  select.addEventListener('change', () => change(select.value as ClassRelationOperator));
  label.append(caption, select);
  return label;
}

function paletteOperatorField(document: Document, value: ClassRelationOperator, change: (value: ClassRelationOperator) => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'mve-class-field';
  const caption = document.createElement('span');
  caption.textContent = 'New relationship';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'New relationship');
  for (const operator of relationOperators) {
    const option = document.createElement('option');
    option.value = operator;
    option.textContent = operator;
    option.selected = operator === value;
    select.append(option);
  }
  select.addEventListener('change', () => change(select.value as ClassRelationOperator));
  label.append(caption, select);
  return label;
}

function nodeId(group: Element, ids: readonly string[]): string | undefined {
  const candidates = [group.getAttribute('data-id'), group.getAttribute('id')].filter(Boolean) as string[];
  for (const candidate of candidates) {
    for (const id of ids) {
      if (candidate === id || candidate === `classId-${id}` || candidate.endsWith(`-${id}`)) return id;
      const marker = candidate.lastIndexOf('classId-');
      if (marker >= 0 && candidate.slice(marker + 'classId-'.length).startsWith(`${id}-`)) {
        const suffix = candidate.slice(marker + 'classId-'.length + id.length + 1);
        if (/^\d+$/.test(suffix) || /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(suffix)) return id;
      }
    }
  }
  return undefined;
}

export const classAdapter: DiagramAdapter = {
  diagramType: 'class',
  mount(context: DiagramAdapterContext): () => void {
    const { toolbar, svg } = context;
    const document = toolbar.ownerDocument;
    const palette = document.createElement('div');
    palette.className = 'mve-class-palette';
    palette.setAttribute('aria-label', 'Class diagram tools');
    const selectionPanel = document.createElement('div');
    selectionPanel.className = 'mve-class-selection';
    const help = document.createElement('span');
    help.className = 'mve-class-help';
    help.textContent = 'Add a class or connect two classes. Double-click a class or relationship to edit it.';
    toolbar.replaceChildren(palette, selectionPanel, help);

    let selected: EditorSelection | null = null;
    let connecting = false;
    let connectionStart: string | undefined;
    let activeOperator: ClassRelationOperator = '-->';
    const ids = listClassIds(context.sourceDocument.source);
    const nodeGroups = [...svg.querySelectorAll<SVGGElement>('g.classGroup, g.class, g.node')];
    const nodeIds = new Map<Element, string>();
    for (const group of nodeGroups) {
      const id = nodeId(group, ids);
      if (id) nodeIds.set(group, id);
    }
    const relationList = listClassRelations(context.sourceDocument.source);
    const relationGroups = [...svg.querySelectorAll<SVGElement>('.edgePaths path, g.edgePath path, path.relation, path.relationshipLine, path[id^="L"], path[id^="edge"]')];
    const relationByElement = new Map<Element, ClassRelation>();
    relationGroups.forEach((group, index) => {
      const relation = relationList[index];
      if (relation) relationByElement.set(group, relation);
    });

    const showError = (error: unknown): void => {
      help.textContent = error instanceof Error ? error.message : 'This class edit could not be applied safely.';
    };
    const mutate = (action: (source: string) => string): boolean => {
      try {
        const applied = context.applySourceMutation((source) => action(source.source));
        if (applied === false) {
          help.textContent = 'This class edit could not be applied.';
          return false;
        }
        help.textContent = 'Class source updated.';
        return true;
      } catch (error) {
        showError(error);
        return false;
      }
    };

    const renderSelection = (): void => {
      selectionPanel.replaceChildren();
      const current = selected;
      if (!current) return;
      if (current.kind === 'node') {
        selectionPanel.append(field(document, 'Class ID', current.id,
          (id) => mutate((source) => renameClassNode(source, current.id, id))));
        let members: string[];
        try { members = listClassMembers(context.sourceDocument.source, current.id); }
        catch { members = []; }
        for (const member of members) {
          selectionPanel.append(field(document, 'Member', member, (value) => mutate((source) => setClassMember(source, current.id, member, value))));
        }
        selectionPanel.append(button(document, '+ Member', 'Add class member', () => mutate((source) => addClassMember(source, current.id))));
        for (const property of ['fill', 'stroke'] as const) {
          selectionPanel.append(field(document, property === 'fill' ? 'Fill color' : 'Border color',
            getClassStyle(context.sourceDocument.source, current.id, property),
            (value) => mutate((source) => setClassStyle(source, current.id, property, value))));
        }
        selectionPanel.append(button(document, 'Delete class', 'Delete class', () => {
          if (mutate((source) => deleteClassNode(source, current.id))) setSelected(null);
        }));
      } else if (current.kind === 'edge') {
        const relation = relationList.find((item) => item.source === current.source && item.target === current.target
          && item.occurrence === (current.occurrence ?? 0));
        if (!relation) return;
        selectionPanel.append(
          field(document, 'From class', relation.source, (sourceId) => mutate((source) => setClassRelation(source, relation, { source: sourceId }))),
          field(document, 'To class', relation.target, (targetId) => mutate((source) => setClassRelation(source, relation, { target: targetId }))),
          operatorField(document, relation.operator, (operator) => mutate((source) => setClassRelation(source, relation, { operator }))),
          button(document, 'Delete relationship', 'Delete relationship', () => {
            if (mutate((source) => deleteClassRelation(source, relation))) setSelected(null);
          }),
        );
      }
    };

    const setSelected = (next: EditorSelection | null): void => {
      selected = next;
      context.setSelection(next);
      svg.querySelectorAll('.mve-selected').forEach((element) => element.classList.remove('mve-selected'));
      if (next?.kind === 'node') nodeGroups.find((group) => nodeIds.get(group) === next.id)?.classList.add('mve-selected');
      if (next?.kind === 'edge') {
        const group = [...relationByElement].find(([, relation]) => relation.source === next.source
          && relation.target === next.target && relation.occurrence === (next.occurrence ?? 0))?.[0];
        group?.classList.add('mve-selected');
      }
      renderSelection();
    };

    const addClass = (): void => { mutate((source) => addClassNode(source)); };
    const connectButton = button(document, connecting ? 'Cancel connection' : 'Connect classes', 'Connect two classes', () => {
      connecting = !connecting;
      connectionStart = undefined;
      connectButton.textContent = connecting ? 'Cancel connection' : 'Connect classes';
      help.textContent = connecting ? 'Select two classes to add an association.' : 'Add a class or connect two classes. Double-click a class or relationship to edit it.';
    });
    palette.append(button(document, '+ Class', 'Add class', addClass),
      paletteOperatorField(document, activeOperator, (operator) => { activeOperator = operator; }), connectButton);

    const selectNode = (id: string): void => {
      if (connecting) {
        if (!connectionStart) {
          connectionStart = id;
          help.textContent = `Select the second class to connect to ${id}.`;
          return;
        }
        const from = connectionStart;
        connectionStart = undefined;
        connecting = false;
        connectButton.textContent = 'Connect classes';
        mutate((source) => addClassRelation(source, from, id, activeOperator));
        return;
      }
      setSelected({ kind: 'node', diagramType: 'class', id });
    };

    const click = (event: Event): void => {
      if (!(event.target instanceof Element)) return;
      const group = event.target.closest('g.classGroup, g.class, g.node');
      if (group && svg.contains(group)) {
        const id = nodeIds.get(group);
        if (id) { selectNode(id); return; }
      }
      const edge = event.target.closest('path.relation, path.relationshipLine, .edgePaths path, g.edgePath path, path[id^="L"], path[id^="edge"]');
      const relation = edge ? relationByElement.get(edge) : undefined;
      if (relation) setSelected({ kind: 'edge', diagramType: 'class', source: relation.source, target: relation.target, occurrence: relation.occurrence });
    };
    const doubleClick = (event: Event): void => {
      click(event);
      if (selected?.kind === 'node') renderSelection();
      if (selected?.kind === 'edge') renderSelection();
    };
    svg.addEventListener('click', click);
    svg.addEventListener('dblclick', doubleClick);

    return () => {
      svg.removeEventListener('click', click);
      svg.removeEventListener('dblclick', doubleClick);
      toolbar.replaceChildren();
    };
  },
};
