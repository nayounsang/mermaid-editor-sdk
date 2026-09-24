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
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    } else if (event.key === 'Escape') {
      input.value = value;
      input.blur();
    }
  });
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
    help.textContent = 'Click a class to edit it. Double-click its name to rename. Choose a relationship, then connect two classes.';
    toolbar.replaceChildren(palette, selectionPanel, help);

    let selected: EditorSelection | null = null;
    let connecting = false;
    let connectionStart: string | undefined;
    let connectionStartGroup: Element | undefined;
    let activeOperator: ClassRelationOperator = '-->';
    const ids = listClassIds(context.sourceDocument.source);
    const nodeGroups = [...svg.querySelectorAll<SVGGElement>('g.classGroup, g.class, g.node')];
    const nodeIds = new Map<Element, string>();
    for (const group of nodeGroups) {
      const id = nodeId(group, ids);
      if (id) {
        nodeIds.set(group, id);
        group.setAttribute('tabindex', '0');
        group.setAttribute('role', 'button');
        group.setAttribute('aria-label', `Select class ${id}`);
        group.setAttribute('aria-roledescription', 'class diagram node');
      }
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
    const mutate = (
      action: (source: string) => string,
      selectionAfterMutation: EditorSelection | null = selected,
      focusSelectionAfterMutation = false,
    ): boolean => {
      try {
        const applied = context.applySourceMutation((source) => action(source.source), selectionAfterMutation, focusSelectionAfterMutation);
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
          (id) => mutate((source) => renameClassNode(source, current.id, id), { kind: 'node', diagramType: 'class', id })));
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
          if (mutate((source) => deleteClassNode(source, current.id), null)) setSelected(null);
        }));
      } else if (current.kind === 'edge') {
        const relation = relationList.find((item) => item.source === current.source && item.target === current.target
          && item.occurrence === (current.occurrence ?? 0));
        if (!relation) return;
        selectionPanel.append(
          field(document, 'From class', relation.source, (sourceId) => mutate(
            (source) => setClassRelation(source, relation, { source: sourceId }),
            { kind: 'edge', diagramType: 'class', source: sourceId, target: relation.target, occurrence: relation.occurrence },
          )),
          field(document, 'To class', relation.target, (targetId) => mutate(
            (source) => setClassRelation(source, relation, { target: targetId }),
            { kind: 'edge', diagramType: 'class', source: relation.source, target: targetId, occurrence: relation.occurrence },
          )),
          operatorField(document, relation.operator, (operator) => mutate((source) => setClassRelation(source, relation, { operator }))),
          button(document, 'Delete relationship', 'Delete relationship', () => {
            if (mutate((source) => deleteClassRelation(source, relation), null)) setSelected(null);
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

    const addClass = (): void => {
      const source = context.sourceDocument.source;
      const existing = new Set(listClassIds(source));
      const nextSource = addClassNode(source);
      const newId = listClassIds(nextSource).find((id) => !existing.has(id));
      mutate(() => nextSource, newId ? { kind: 'node', diagramType: 'class', id: newId } : undefined, Boolean(newId));
    };
    const connectButton = button(document, 'Connect classes', 'Connect two classes', () => {
      connecting = !connecting;
      connectionStart = undefined;
      connectionStartGroup?.classList.remove('mve-connect-start');
      connectionStartGroup = undefined;
      connectButton.textContent = connecting ? 'Cancel connection' : 'Connect classes';
      connectButton.setAttribute('aria-pressed', String(connecting));
      help.textContent = connecting ? 'Choose two classes: click a start class, then a target class.' : 'Click a class to edit it. Double-click its name to rename. Choose a relationship, then connect two classes.';
    });
    connectButton.setAttribute('aria-pressed', 'false');
    palette.append(button(document, '+ Class', 'Add class', addClass),
      paletteOperatorField(document, activeOperator, (operator) => { activeOperator = operator; }), connectButton);

    const selectNode = (id: string, group: Element): void => {
      if (connecting) {
        if (!connectionStart) {
          connectionStart = id;
          connectionStartGroup = group;
          group.classList.add('mve-connect-start');
          connectButton.textContent = 'Choose target class…';
          help.textContent = `Start class: ${id}. Now click the class to connect it to.`;
          return;
        }
        const from = connectionStart;
        connectionStart = undefined;
        connecting = false;
        connectionStartGroup?.classList.remove('mve-connect-start');
        connectionStartGroup = undefined;
        connectButton.textContent = 'Connect classes';
        connectButton.setAttribute('aria-pressed', 'false');
        const source = context.sourceDocument.source;
        const nextSource = addClassRelation(source, from, id, activeOperator);
        const matchingRelations = listClassRelations(nextSource).filter((relation) => relation.source === from && relation.target === id);
        mutate(() => nextSource, {
          kind: 'edge', diagramType: 'class', source: from, target: id, occurrence: matchingRelations.length - 1,
        });
        return;
      }
      setSelected({ kind: 'node', diagramType: 'class', id });
    };

    const click = (event: Event): void => {
      if (!(event.target instanceof Element)) return;
      const group = event.target.closest('g.classGroup, g.class, g.node');
      if (group && svg.contains(group)) {
        const id = nodeIds.get(group);
        if (id) { selectNode(id, group); return; }
      }
      const edge = event.target.closest('path.relation, path.relationshipLine, .edgePaths path, g.edgePath path, path[id^="L"], path[id^="edge"]');
      const relation = edge ? relationByElement.get(edge) : undefined;
      if (relation) setSelected({ kind: 'edge', diagramType: 'class', source: relation.source, target: relation.target, occurrence: relation.occurrence });
    };
    const doubleClick = (event: Event): void => {
      if (!(event.target instanceof Element)) return;
      const group = event.target.closest('g.classGroup, g.class, g.node');
      if (group && svg.contains(group)) {
        const id = nodeIds.get(group);
        if (id) {
          selectNode(id, group);
          const input = selectionPanel.querySelector<HTMLInputElement>('[aria-label="Class ID"]');
          input?.focus();
          input?.select();
          return;
        }
      }
      click(event);
      if (selected?.kind === 'edge') {
        const input = selectionPanel.querySelector<HTMLInputElement>('[aria-label="From class"]');
        input?.focus();
        input?.select();
      }
    };
    const keydown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (!(event.target instanceof Element)) return;
      const group = event.target.closest('g.classGroup, g.class, g.node');
      const id = group ? nodeIds.get(group) : undefined;
      if (!group || !id || !svg.contains(group)) return;
      event.preventDefault();
      selectNode(id, group);
    };
    svg.addEventListener('click', click);
    svg.addEventListener('dblclick', doubleClick);
    svg.addEventListener('keydown', keydown);
    const initial = context.initialSelection;
    if (initial?.diagramType === 'class' && initial.kind === 'node'
      && nodeGroups.some((group) => nodeIds.get(group) === initial.id)) {
      setSelected(initial);
      if (context.focusInitialSelection) {
        const input = selectionPanel.querySelector<HTMLInputElement>('[aria-label="Class ID"]');
        input?.focus();
        input?.select();
      }
    } else if (initial?.diagramType === 'class' && initial.kind === 'edge'
      && [...relationByElement.values()].some((relation) => relation.source === initial.source
        && relation.target === initial.target && relation.occurrence === initial.occurrence)) {
      setSelected(initial);
      if (context.focusInitialSelection) {
        const input = selectionPanel.querySelector<HTMLInputElement>('[aria-label="From class"]');
        input?.focus();
        input?.select();
      }
    }

    return () => {
      svg.removeEventListener('click', click);
      svg.removeEventListener('dblclick', doubleClick);
      svg.removeEventListener('keydown', keydown);
      toolbar.replaceChildren();
    };
  },
};
