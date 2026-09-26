import type { DiagramAdapter, DiagramAdapterContext } from './adapter';
import {
  addERAttribute,
  addEREntity,
  addERRelationship,
  deleteERAttribute,
  deleteEREntity,
  deleteERRelationship,
  getERStyles,
  listERAttributes,
  listEREntityIds,
  listERRelationships,
  renameEREntity,
  setERAttribute,
  setERStyle,
  setERRelationship,
  type ERAttribute,
  type ERCardinality,
  type ERRelationship,
} from '../source/er-mutations';
import type { EditorSelection } from '../runtime/types';
import { installPointerConnections } from './pointer-connections';

const cardinalities: ReadonlyArray<readonly [ERCardinality, string]> = [
  ['one-one', 'One to one  ||--||'],
  ['one-many', 'One to many  ||--o{'],
  ['many-many', 'Many to many  }o--o{'],
  ['zero-one', 'Zero or one  |o--||'],
  ['one-or-many', 'One or many  ||--|{'],
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
  label.className = 'mve-er-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const input = ['Relationship label', 'Attribute comment'].includes(labelText) ? document.createElement('textarea') : document.createElement('input');
  input.value = value;
  input.setAttribute('aria-label', labelText);
  input.addEventListener('change', () => change(input.value));
  label.append(caption, input);
  return label;
}

function selectField<T extends string>(document: Document, labelText: string, value: T, options: ReadonlyArray<readonly [T, string]>, change: (value: T) => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'mve-er-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const select = document.createElement('select');
  select.setAttribute('aria-label', labelText);
  for (const [optionValue, text] of options) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = text;
    option.selected = optionValue === value;
    select.append(option);
  }
  select.addEventListener('change', () => change(select.value as T));
  label.append(caption, select);
  return label;
}

function entityId(group: Element, matchers: ReadonlyArray<readonly [string, string]>): string | undefined {
  const raw = group.getAttribute('id') ?? group.getAttribute('data-id') ?? '';
  return matchers.find(([, marker]) => {
    const markerStart = raw.lastIndexOf(marker);
    return markerStart >= 0 && /^\d+$/.test(raw.slice(markerStart + marker.length));
  })?.[0];
}

export const erAdapter: DiagramAdapter = {
  diagramType: 'er',
  mount(context: DiagramAdapterContext): () => void {
    const { toolbar, svg } = context;
    const document = toolbar.ownerDocument;
    const palette = document.createElement('div');
    palette.className = 'mve-er-palette';
    palette.setAttribute('aria-label', 'ER diagram tools');
    const selectionPanel = document.createElement('div');
    selectionPanel.className = 'mve-er-selection';
    const help = document.createElement('span');
    help.className = 'mve-er-help';
    help.textContent = 'Select an entity or relationship. Connect entities to add a relationship.';
    toolbar.replaceChildren(palette, selectionPanel, help);

    const ids = listEREntityIds(context.sourceDocument.source);
    const entityMatchers = [...ids]
      .sort((left, right) => right.length - left.length)
      .map((id) => [id, `-entity-${id}-`] as const);
    const nodeGroups = [...svg.querySelectorAll<SVGGElement>('g.node[id*="-entity-"]')];
    const nodeIds = new Map<Element, string>();
    for (const group of nodeGroups) {
      const id = entityId(group, entityMatchers);
      if (id) nodeIds.set(group, id);
    }
    const relationships = listERRelationships(context.sourceDocument.source);
    const edgeGroups = [...svg.querySelectorAll<SVGElement>('path.relationshipLine')];
    const edgeMappingSafe = edgeGroups.length === relationships.length;
    const edgeByElement = new Map<Element, ERRelationship>();
    if (edgeMappingSafe) {
      edgeGroups.forEach((element, index) => { if (relationships[index]) edgeByElement.set(element, relationships[index]!); });
    }
    let selected: EditorSelection | null = null;
    let connectionStart: string | undefined;
    let connectionArmed = false;
    let activeCardinality: ERCardinality = 'one-many';
    let activeIdentifying = true;

    const mutate = (action: (source: string) => string, removing = false): boolean => {
      try {
        if ((removing ? (context.removeSourceMutation ?? context.applySourceMutation) : context.applySourceMutation)((source) => action(source.source)) === false) {
          help.textContent = 'This ER edit could not be applied.';
          return false;
        }
        help.textContent = 'ER source updated.';
        return true;
      } catch (error) {
        help.textContent = error instanceof Error ? error.message : 'This ER edit could not be applied safely.';
        return false;
      }
    };

    const setSelected = (next: EditorSelection | null): void => {
      selected = next;
      context.setSelection(next);
      renderSelection();
    };

    const addAttributeRow = (attribute: ERAttribute): HTMLDivElement => {
      const row = document.createElement('div');
      row.className = 'mve-er-attribute';
      row.append(
        field(document, 'Attribute type', attribute.type,
          (type) => mutate((source) => setERAttribute(source, attribute.entity, attribute, { type }))),
        field(document, 'Attribute name', attribute.name,
          (name) => mutate((source) => setERAttribute(source, attribute.entity, attribute, { name }))),
        field(document, 'Key marker', attribute.key,
          (key) => mutate((source) => setERAttribute(source, attribute.entity, attribute, { key }))),
        field(document, 'Attribute comment', attribute.comment,
          (comment) => mutate((source) => setERAttribute(source, attribute.entity, attribute, { comment }))),
        button(document, '×', `Delete attribute ${attribute.name}`, () => {
          mutate((source) => deleteERAttribute(source, attribute.entity, attribute), true);
        }),
      );
      return row;
    };

    const renderSelection = (): void => {
      selectionPanel.replaceChildren();
      svg.querySelectorAll('.mve-selected').forEach((element) => element.classList.remove('mve-selected'));
      const current = selected;
      if (!current) return;
      if (current.kind === 'node') {
        const group = nodeGroups.find((item) => nodeIds.get(item) === current.id);
        group?.classList.add('mve-selected');
        selectionPanel.append(field(document, 'Entity ID', current.id,
          (id) => mutate((source) => renameEREntity(source, current.id, id))));
        for (const attribute of listERAttributes(context.sourceDocument.source, current.id)) {
          selectionPanel.append(addAttributeRow(attribute));
        }
        selectionPanel.append(button(document, '+ Attribute', 'Add attribute', () => mutate((source) => addERAttribute(source, current.id))));
        const styles = getERStyles(context.sourceDocument.source, current.id);
        for (const property of ['fill', 'stroke'] as const) {
          selectionPanel.append(field(document, property === 'fill' ? 'Fill color' : 'Border color',
            styles[property],
            (value) => mutate((source) => setERStyle(source, current.id, property, value))));
        }
        selectionPanel.append(selectField(document, 'Border line', styles['stroke-dasharray'],
          [['', 'Default'], ['0', 'Solid'], ['6 4', 'Dashed'], ['2 3', 'Dotted']],
          (value) => mutate((source) => setERStyle(source, current.id, 'stroke-dasharray', value))));
        selectionPanel.append(button(document, 'Delete entity', 'Delete entity', () => {
          if (mutate((source) => deleteEREntity(source, current.id), true)) setSelected(null);
        }));
      } else if (current.kind === 'edge') {
        const relationship = relationships.find((item) => item.source === current.source && item.target === current.target
          && item.occurrence === (current.occurrence ?? 0));
        if (!relationship) return;
        edgeGroups.forEach((edge, index) => {
          const item = edgeByElement.get(edge) ?? relationships[index];
          if (item?.source === relationship.source && item.target === relationship.target && item.occurrence === relationship.occurrence) {
            edge.classList.add('mve-selected');
          }
        });
        selectionPanel.append(
          field(document, 'From entity', relationship.source,
            (sourceId) => mutate((source) => setERRelationship(source, relationship, { source: sourceId }))),
          field(document, 'To entity', relationship.target,
            (targetId) => mutate((source) => setERRelationship(source, relationship, { target: targetId }))),
          selectField(document, 'Cardinality', relationship.cardinality, cardinalities,
            (cardinality) => mutate((source) => setERRelationship(source, relationship, { cardinality }))),
          selectField(document, 'Relationship line', relationship.identifying ? 'identifying' : 'non-identifying',
            [['identifying', 'Identifying (solid)'], ['non-identifying', 'Non-identifying (dashed)']],
            (line) => mutate((source) => setERRelationship(source, relationship, { identifying: line === 'identifying' })),
          ),
          field(document, 'Relationship label', relationship.label,
            (label) => mutate((source) => setERRelationship(source, relationship, { label }))),
          button(document, 'Delete relationship', 'Delete relationship', () => {
            if (mutate((source) => deleteERRelationship(source, relationship), true)) setSelected(null);
          }),
        );
      }
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
      item.addEventListener('dragstart', (event) => event.dataTransfer?.setData('application/x-mve-er-palette', ariaLabel));
      group.append(item);
    };
    const entities = makeGroup('Entity');
    addItem(entities, 'Entity with fields', '{}', 'Add entity', () => mutate((source) => {
      const next = addEREntity(source);
      const added = listEREntityIds(next).find((id) => !listEREntityIds(source).includes(id));
      return added ? addERAttribute(next, added) : next;
    }));
    addItem(entities, 'Empty entity', 'E', 'Add empty entity', () => mutate((source) => addEREntity(source)));
    const relations = makeGroup('Relations');
    const cardinalityField = selectField(document, 'New relationship cardinality', activeCardinality, cardinalities,
      (value) => { activeCardinality = value; });
    const legacyControls = document.createElement('div');
    legacyControls.hidden = true;
    legacyControls.append(cardinalityField,
      selectField(document, 'New relationship line', 'identifying',
        [['identifying', 'Identifying'], ['non-identifying', 'Non-identifying']],
        (value) => { activeIdentifying = value === 'identifying'; }),
      button(document, 'Connect entities', 'Connect two entities', () => {
        connectionArmed = !connectionArmed;
        connectionStart = undefined;
        help.textContent = connectionArmed ? 'Select two entities to add a relationship.'
          : 'Select an entity or relationship. Connect entities to add a relationship.';
      }));
    relations.append(legacyControls);
    for (const [label, icon, cardinality] of [
      ['One-to-many', '||..o{', 'one-many'],
      ['One-to-one', '||..||', 'one-one'],
      ['Many-to-many', '}o..o{', 'many-many'],
      ['Zero-or-one', '|o..||', 'zero-one'],
      ['One-or-many', '||..|{', 'one-or-many'],
    ] as const) addItem(relations, label, icon, `Use ${label.toLowerCase()} relationship`, () => {
      activeCardinality = cardinality;
      connectionArmed = true;
      connectionStart = undefined;
      help.textContent = 'Select two entities to add a relationship.';
    });

    const connectEntities = (from: string, to: string): void => {
      connectionStart = undefined;
      connectionArmed = false;
      mutate((source) => addERRelationship(source, from, to, activeCardinality, 'relates', activeIdentifying));
    };

    const click = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const node = target.closest('g.node[id*="-entity-"]');
      if (node && svg.contains(node)) {
        const id = nodeIds.get(node);
        if (!id) return;
        if (connectionArmed) {
          if (!connectionStart) {
            connectionStart = id;
            help.textContent = `Choose a destination for ${id}.`;
          } else if (connectionStart !== id) {
            connectEntities(connectionStart, id);
          }
          return;
        }
        setSelected({ kind: 'node', diagramType: 'er', id });
        return;
      }
      const edge = target.closest('path.relationshipLine');
      if (edge && svg.contains(edge)) {
        const relationship = edgeByElement.get(edge);
        if (!edgeMappingSafe) {
          help.textContent = 'Relationship selection is unavailable while the source contains unsupported relationship syntax.';
          return;
        }
        if (relationship) setSelected({ kind: 'edge', diagramType: 'er', source: relationship.source,
          target: relationship.target, occurrence: relationship.occurrence });
        return;
      }
      setSelected(null);
    };
    svg.addEventListener('click', click);
    const removePointerConnections = installPointerConnections(svg, (target) => {
      if (!(target instanceof Element)) return undefined;
      const element = target.closest('g.node[id*="-entity-"]');
      const id = element && svg.contains(element) ? nodeIds.get(element) : undefined;
      return id && element ? { id, element } : undefined;
    }, connectEntities, (target) => {
      if (!(target instanceof Element) || !edgeMappingSafe) return undefined;
      const path = target.closest<SVGPathElement>('path.relationshipLine');
      const relationship = path && svg.contains(path) ? edgeByElement.get(path) : undefined;
      return path && relationship ? {
        path, source: relationship.source, target: relationship.target,
        reconnect: (endpoint: 'source' | 'target', id: string) => {
          mutate((source) => setERRelationship(source, relationship, { [endpoint]: id }));
        },
      } : undefined;
    });
    const dragOver = (event: DragEvent): void => {
      if (event.dataTransfer?.types.includes('application/x-mve-er-palette')) event.preventDefault();
    };
    const drop = (event: DragEvent): void => {
      const label = event.dataTransfer?.getData('application/x-mve-er-palette');
      const item = [...palette.querySelectorAll<HTMLButtonElement>('button')].find((candidate) => candidate.getAttribute('aria-label') === label);
      if (item) { event.preventDefault(); item.click(); }
    };
    svg.addEventListener('dragover', dragOver);
    svg.addEventListener('drop', drop);
    return () => {
      svg.removeEventListener('click', click);
      removePointerConnections();
      svg.removeEventListener('dragover', dragOver);
      svg.removeEventListener('drop', drop);
      toolbar.replaceChildren();
      selected = null;
      context.setSelection(null);
    };
  },
};
