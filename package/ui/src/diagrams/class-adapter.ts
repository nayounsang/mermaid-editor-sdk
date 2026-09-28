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
} from '@mermaid-editor-sdk/headless';
import type { EditorSelection } from '../runtime/types';
import { installPointerConnections } from './pointer-connections';

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
  const input = ['Member'].includes(labelText) ? document.createElement('textarea') : document.createElement('input');
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

function borderLineField(document: Document, value: string, change: (value: string) => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'mve-class-field';
  const caption = document.createElement('span');
  caption.textContent = 'Border line';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Border line');
  for (const [dash, text] of [['', 'Default'], ['0', 'Solid'], ['6 4', 'Dashed'], ['2 3', 'Dotted']]) {
    const option = document.createElement('option');
    option.value = dash!;
    option.textContent = text!;
    option.selected = dash === value;
    select.append(option);
  }
  select.addEventListener('change', () => change(select.value));
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
    let activeCardinality: 'one-many' | 'one-one' | undefined;
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
    const mutate = (action: (source: string) => string, removing = false): boolean => {
      try {
        const applied = (removing ? (context.removeSourceMutation ?? context.applySourceMutation) : context.applySourceMutation)((source) => action(source.source));
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
        selectionPanel.append(borderLineField(document, getClassStyle(context.sourceDocument.source, current.id, 'stroke-dasharray'),
          (value) => mutate((source) => setClassStyle(source, current.id, 'stroke-dasharray', value))));
        selectionPanel.append(button(document, 'Delete class', 'Delete class', () => {
          if (mutate((source) => deleteClassNode(source, current.id), true)) setSelected(null);
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
            if (mutate((source) => deleteClassRelation(source, relation), true)) setSelected(null);
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
    const addEmptyClass = (): void => { mutate((source) => {
      const full = addClassNode(source);
      return full.replace(/(class\s+Class\d+)\s*\{\s*\}(\s*)$/, '$1$2');
    }); };
    const armRelation = (operator: ClassRelationOperator, cardinality?: 'one-many' | 'one-one'): void => {
      activeOperator = operator;
      activeCardinality = cardinality;
      connecting = true;
      connectionStart = undefined;
      help.textContent = 'Select two classes to add a relationship.';
    };
    const makeGroup = (title: string): HTMLElement => {
      const group = document.createElement('section');
      group.className = 'mve-palette-group';
      const heading = document.createElement('h3');
      heading.textContent = title;
      group.append(heading);
      palette.append(group);
      return group;
    };
    const addItem = (group: HTMLElement, label: string, icon: string, ariaLabel: string, action: () => void): void => {
      const item = button(document, label, ariaLabel, action);
      const symbol = document.createElement('span');
      symbol.className = 'mve-palette-icon';
      symbol.textContent = icon;
      item.append(symbol);
      item.draggable = true;
      item.addEventListener('dragstart', (event) => {
        event.dataTransfer?.setData('application/x-mve-class-palette', ariaLabel);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
      });
      group.append(item);
    };
    const classes = makeGroup('Class');
    addItem(classes, 'Class block', 'class', 'Add class', addClass);
    addItem(classes, 'Empty class', 'cls', 'Add empty class', addEmptyClass);
    const relations = makeGroup('Relations');
    for (const [label, icon, operator, ariaLabel] of [
      ['Inheritance', '<|--', '<|--', 'Use inheritance relation'],
      ['Composition', '*--', '*--', 'Use composition relation'],
      ['Aggregation', 'o--', 'o--', 'Use aggregation relation'],
      ['Association', '-->', '-->', 'Connect two classes'],
      ['Dependency', '..>', '..>', 'Use dependency relation'],
      ['Realization', '<|..', '<|..', 'Use realization relation'],
    ] as const) addItem(relations, label, icon, ariaLabel, () => armRelation(operator));
    const cardinality = makeGroup('Cardinality');
    addItem(cardinality, 'One-to-many', '1..*', 'Use one-to-many relation', () => armRelation('-->', 'one-many'));
    addItem(cardinality, 'One-to-one', '1..1', 'Use one-to-one relation', () => armRelation('-->', 'one-one'));

    const connectRelation = (from: string, to: string): void => {
      connecting = false;
      connectionStart = undefined;
      mutate((source) => {
          const next = addClassRelation(source, from, to, activeOperator);
          if (!activeCardinality) return next;
          const ending = activeCardinality === 'one-many' ? '0..*' : '1';
          const suffix = `${from} ${activeOperator} ${to}`;
          const position = next.lastIndexOf(suffix);
          return position >= 0 && !next.slice(position + suffix.length).trim()
            ? `${next.slice(0, position)}${from} "1" ${activeOperator} "${ending}" ${to}${next.slice(position + suffix.length)}`
            : next;
      });
      activeCardinality = undefined;
    };
    const selectNode = (id: string): void => {
      if (connecting) {
        if (!connectionStart) {
          connectionStart = id;
          help.textContent = `Select the second class to connect to ${id}.`;
          return;
        }
        connectRelation(connectionStart, id);
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
      else setSelected(null);
    };
    const doubleClick = (event: Event): void => {
      click(event);
      if (selected?.kind === 'node') renderSelection();
      if (selected?.kind === 'edge') renderSelection();
    };
    svg.addEventListener('click', click);
    svg.addEventListener('dblclick', doubleClick);
    const removePointerConnections = installPointerConnections(svg, (target) => {
      if (!(target instanceof Element)) return undefined;
      const element = target.closest('g.classGroup, g.class, g.node');
      const id = element && svg.contains(element) ? nodeIds.get(element) : undefined;
      return id && element ? { id, element } : undefined;
    }, connectRelation, (target) => {
      if (!(target instanceof Element)) return undefined;
      const path = target.closest<SVGPathElement>('path.relation, path.relationshipLine, .edgePaths path, g.edgePath path, path[id^="L"], path[id^="edge"]');
      const relation = path && svg.contains(path) ? relationByElement.get(path) : undefined;
      return path && relation ? {
        path, source: relation.source, target: relation.target,
        reconnect: (endpoint: 'source' | 'target', id: string) => {
          mutate((source) => setClassRelation(source, relation, { [endpoint]: id }));
        },
      } : undefined;
    });
    const dragOver = (event: DragEvent): void => {
      if (event.dataTransfer?.types.includes('application/x-mve-class-palette')) event.preventDefault();
    };
    const drop = (event: DragEvent): void => {
      const label = event.dataTransfer?.getData('application/x-mve-class-palette');
      if (!label) return;
      const item = [...palette.querySelectorAll<HTMLButtonElement>('button')].find((candidate) => candidate.getAttribute('aria-label') === label);
      if (item) { event.preventDefault(); item.click(); }
    };
    svg.addEventListener('dragover', dragOver);
    svg.addEventListener('drop', drop);

    return () => {
      svg.removeEventListener('click', click);
      svg.removeEventListener('dblclick', doubleClick);
      removePointerConnections();
      svg.removeEventListener('dragover', dragOver);
      svg.removeEventListener('drop', drop);
      toolbar.replaceChildren();
    };
  },
};
