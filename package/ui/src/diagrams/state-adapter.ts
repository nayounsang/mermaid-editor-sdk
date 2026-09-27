import type { DiagramAdapter, DiagramAdapterContext } from './adapter';
import {
  addState,
  addStateTransition,
  deleteState,
  deleteStateTransition,
  getStateAppearance,
  listStateIds,
  listStateTransitions,
  renameState,
  setStateTransition,
  setStateStyle,
  setStateBorderType,
  type StateTransition,
} from '@mermaid-editor/headless';
import type { EditorSelection } from '../runtime/types';
import { installPointerConnections } from './pointer-connections';

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
  label.className = 'mve-state-field';
  const caption = document.createElement('span');
  caption.textContent = labelText;
  const input = ['Transition label'].includes(labelText) ? document.createElement('textarea') : document.createElement('input');
  input.value = value;
  input.setAttribute('aria-label', labelText);
  input.addEventListener('change', () => change(input.value));
  label.append(caption, input);
  return label;
}

function borderField(document: Document, value: '' | 'solid' | 'dashed' | 'dotted', change: (value: 'solid' | 'dashed' | 'dotted') => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'mve-state-field';
  const caption = document.createElement('span');
  caption.textContent = 'Border line';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Border line');
  for (const [optionValue, text] of [['', 'Unchanged'], ['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted']] as const) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = text;
    option.selected = optionValue === value;
    select.append(option);
  }
  select.addEventListener('change', () => {
    if (select.value) change(select.value as 'solid' | 'dashed' | 'dotted');
  });
  label.append(caption, select);
  return label;
}

function stateId(group: Element, ids: ReadonlySet<string>): string | undefined {
  const values = [group.getAttribute('data-id'), group.getAttribute('id')].filter(Boolean) as string[];
  for (const raw of values) {
    if (ids.has(raw)) return raw;
    const stateMarker = raw.lastIndexOf('state-');
    if (stateMarker >= 0) {
      const rendered = raw.slice(stateMarker + 'state-'.length);
      if (ids.has(rendered)) return rendered;
      const counterSeparator = rendered.lastIndexOf('-');
      if (counterSeparator > 0 && /^\d+$/.test(rendered.slice(counterSeparator + 1))) {
        const id = rendered.slice(0, counterSeparator);
        if (ids.has(id)) return id;
      }
    }
    for (let separator = raw.indexOf('-'); separator >= 0; separator = raw.indexOf('-', separator + 1)) {
      const id = raw.slice(separator + 1);
      if (ids.has(id)) return id;
    }
  }
  const label = group.querySelector('.nodeLabel, .state-title')?.textContent?.trim();
  return label && ids.has(label) ? label : undefined;
}

export const stateAdapter: DiagramAdapter = {
  diagramType: 'state',
  mount(context: DiagramAdapterContext): () => void {
    const { toolbar, svg } = context;
    const document = toolbar.ownerDocument;
    const palette = document.createElement('div');
    palette.className = 'mve-state-palette';
    palette.setAttribute('aria-label', 'State diagram tools');
    const selectionPanel = document.createElement('div');
    selectionPanel.className = 'mve-state-selection';
    const help = document.createElement('span');
    help.className = 'mve-state-help';
    help.textContent = 'Select a state or transition. Connect states to add a transition.';
    toolbar.replaceChildren(palette, selectionPanel, help);

    const stateIds = listStateIds(context.sourceDocument.source);
    const ids = new Set(stateIds);
    const nodeGroups = [...svg.querySelectorAll<SVGGElement>('g.statediagram-state, g.stateGroup, g.node[id^="state-"], g[id^="state-"]')];
    const nodeIds = new Map<Element, string>();
    for (const group of nodeGroups) {
      const id = stateId(group, ids);
      if (id) nodeIds.set(group, id);
    }
    const transitions = listStateTransitions(context.sourceDocument.source);
    const edgeSelector = 'path.transition:not(.note-edge), .edgePaths path:not(.note-edge), g.edgePath path:not(.note-edge)';
    const edgeGroups = [...svg.querySelectorAll<SVGElement>(edgeSelector)];
    const edgeByElement = new Map<Element, StateTransition>();
    edgeGroups.forEach((element, index) => { if (transitions[index]) edgeByElement.set(element, transitions[index]!); });
    let selected: EditorSelection | null = null;
    let connectionStart: string | undefined;
    let connectionMode: 'normal' | 'start' | 'end' = 'normal';
    let transitionLabel = '';
    let active = true;

    const mutate = (action: (source: string) => string, removing = false): boolean => {
      try {
        if ((removing ? (context.removeSourceMutation ?? context.applySourceMutation) : context.applySourceMutation)((source) => action(source.source)) === false) {
          help.textContent = 'This state edit could not be applied.';
          return false;
        }
        help.textContent = 'State source updated.';
        return true;
      } catch (error) {
        help.textContent = error instanceof Error ? error.message : 'This state edit could not be applied safely.';
        return false;
      }
    };

    const renderSelection = (): void => {
      selectionPanel.replaceChildren();
      svg.querySelectorAll('.mve-selected').forEach((element) => element.classList.remove('mve-selected'));
      const current = selected;
      if (!current) return;
      if (current.kind === 'node') {
        nodeGroups.find((group) => nodeIds.get(group) === current.id)?.classList.add('mve-selected');
        const appearance = getStateAppearance(context.sourceDocument.source, current.id);
        selectionPanel.append(field(document, 'State ID', current.id,
          (id) => mutate((source) => renameState(source, current.id, id))));
        for (const property of ['fill', 'stroke'] as const) {
          selectionPanel.append(field(document, property === 'fill' ? 'Fill color' : 'Border color',
            appearance[property],
            (value) => mutate((source) => setStateStyle(source, current.id, property, value))));
        }
        selectionPanel.append(borderField(document, appearance.borderType,
          (border) => mutate((source) => setStateBorderType(source, current.id, border))));
        selectionPanel.append(button(document, 'Delete state', 'Delete state', () => {
          if (mutate((source) => deleteState(source, current.id), true)) setSelected(null);
        }));
      } else if (current.kind === 'edge') {
        const edge = transitions.find((item) => item.source === current.source && item.target === current.target
          && item.occurrence === (current.occurrence ?? 0));
        if (!edge) return;
        edgeGroups.forEach((group, index) => {
          const item = edgeByElement.get(group) ?? transitions[index];
          if (item?.source === edge.source && item.target === edge.target && item.occurrence === edge.occurrence) group.classList.add('mve-selected');
        });
        selectionPanel.append(
          field(document, 'From state', edge.source, (source) => mutate((text) => setStateTransition(text, edge, { source }))),
          field(document, 'To state', edge.target, (target) => mutate((text) => setStateTransition(text, edge, { target }))),
          field(document, 'Transition label', edge.label, (label) => mutate((text) => setStateTransition(text, edge, { label }))),
          button(document, 'Delete transition', 'Delete transition', () => {
            if (mutate((source) => deleteStateTransition(source, edge), true)) setSelected(null);
          }),
        );
      }
    };

    const setSelected = (next: EditorSelection | null): void => {
      selected = next;
      context.setSelection(next);
      renderSelection();
    };

    const appendStatement = (source: string, statement: string): string => {
      const ending = source.includes('\r\n') ? '\r\n' : '\n';
      return `${source.replace(/(?:\r\n|\r|\n)+$/, '')}${ending}${statement}`;
    };
    const freshId = (source: string, prefix: string): string => {
      const used = new Set(listStateIds(source));
      let index = 1;
      while (used.has(`${prefix}${index}`)) index++;
      return `${prefix}${index}`;
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
      item.addEventListener('dragstart', (event) => event.dataTransfer?.setData('application/x-mve-state-palette', ariaLabel));
      group.append(item);
    };
    const states = makeGroup('States');
    addItem(states, 'Simple state', 's', 'Add state', () => mutate((source) => addState(source)));
    addItem(states, 'Composite', '{}', 'Add composite state', () => mutate((source) => {
      const id = freshId(source, 'Composite');
      const ending = source.includes('\r\n') ? '\r\n' : '\n';
      return appendStatement(source, `state ${id} {${ending}  ${id}Inner${ending}}`);
    }));
    addItem(states, 'Choice', 'cx', 'Add choice state', () => mutate((source) => {
      const id = freshId(source, 'Choice');
      return appendStatement(source, `state ${id} <<choice>>`);
    }));
    const transitionGroup = makeGroup('Transitions');
    const arm = (mode: 'normal' | 'start' | 'end', label = ''): void => {
      connectionMode = mode;
      transitionLabel = label;
      connectionStart = '';
      help.textContent = mode === 'normal' ? 'Select two states to add a transition.' : 'Select a state to connect.';
    };
    addItem(transitionGroup, 'Start → state', '[*]→', 'Add start transition', () => arm('start'));
    addItem(transitionGroup, 'State → end', '→[*]', 'Add end transition', () => arm('end'));
    addItem(transitionGroup, 'Transition', '-->', 'Connect two states', () => arm('normal'));
    addItem(transitionGroup, 'Labeled', '-->:', 'Add labeled transition', () => arm('normal', 'event'));
    const notes = makeGroup('Notes');
    addItem(notes, 'Note', 'n', 'Add note', () => mutate((source) => {
      const next = listStateIds(source).length ? source : addState(source);
      const id = listStateIds(next)[0]!;
      return appendStatement(next, `note right of ${id} : Note`);
    }));

    const connectStates = (from: string, to: string): void => {
      connectionStart = undefined;
      connectionMode = 'normal';
      mutate((source) => addStateTransition(source, from, to, transitionLabel));
      transitionLabel = '';
    };

    const click = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const node = target.closest('g.statediagram-state, g.stateGroup, g.node[id^="state-"], g[id^="state-"]');
      if (node && svg.contains(node)) {
        const id = nodeIds.get(node);
        if (!id) return;
        if (connectionStart !== undefined) {
          if (connectionMode === 'start' || connectionMode === 'end') {
            const statement = connectionMode === 'start' ? `[*] --> ${id}` : `${id} --> [*]`;
            connectionStart = undefined;
            connectionMode = 'normal';
            mutate((source) => appendStatement(source, statement));
            return;
          }
          if (connectionStart === '') {
            connectionStart = id;
            help.textContent = `Choose a destination for ${id}.`;
          } else if (connectionStart !== id) {
            connectStates(connectionStart, id);
          }
          return;
        }
        setSelected({ kind: 'node', diagramType: 'state', id });
        return;
      }
      const path = target.closest(edgeSelector);
      if (path && svg.contains(path)) {
        const edge = edgeByElement.get(path);
        if (edge) setSelected({ kind: 'edge', diagramType: 'state', source: edge.source, target: edge.target, occurrence: edge.occurrence });
        return;
      }
      setSelected(null);
    };
    svg.addEventListener('click', click);
    const removePointerConnections = installPointerConnections(svg, (target) => {
      if (!(target instanceof Element)) return undefined;
      const element = target.closest('g.statediagram-state, g.stateGroup, g.node[id^="state-"], g[id^="state-"]');
      const id = element && svg.contains(element) ? nodeIds.get(element) : undefined;
      return id && element ? { id, element } : undefined;
    }, connectStates, (target) => {
      if (!(target instanceof Element)) return undefined;
      const path = target.closest<SVGPathElement>(edgeSelector);
      const edge = path && svg.contains(path) ? edgeByElement.get(path) : undefined;
      return path && edge ? {
        path, source: edge.source, target: edge.target,
        reconnect: (endpoint: 'source' | 'target', id: string) => {
          mutate((source) => setStateTransition(source, edge, { [endpoint]: id }));
        },
      } : undefined;
    });
    const dragOver = (event: DragEvent): void => {
      if (event.dataTransfer?.types.includes('application/x-mve-state-palette')) event.preventDefault();
    };
    const drop = (event: DragEvent): void => {
      const label = event.dataTransfer?.getData('application/x-mve-state-palette');
      const item = [...palette.querySelectorAll<HTMLButtonElement>('button')].find((candidate) => candidate.getAttribute('aria-label') === label);
      if (item) { event.preventDefault(); item.click(); }
    };
    svg.addEventListener('dragover', dragOver);
    svg.addEventListener('drop', drop);
    return () => {
      if (!active) return;
      active = false;
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
