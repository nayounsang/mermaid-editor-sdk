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
} from '../source/state-mutations';
import type { EditorSelection } from '../runtime/types';

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
  const input = document.createElement('input');
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
    let active = true;

    const mutate = (action: (source: string) => string): boolean => {
      try {
        if (context.applySourceMutation((source) => action(source.source)) === false) {
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
          if (mutate((source) => deleteState(source, current.id))) setSelected(null);
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
            if (mutate((source) => deleteStateTransition(source, edge))) setSelected(null);
          }),
        );
      }
    };

    const setSelected = (next: EditorSelection | null): void => {
      selected = next;
      context.setSelection(next);
      renderSelection();
    };

    palette.append(button(document, '+ State', 'Add state', () => mutate((source) => addState(source))));
    palette.append(button(document, 'Connect states', 'Connect two states', () => {
      connectionStart = '';
      help.textContent = 'Select two states to add a transition.';
    }));

    const click = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const node = target.closest('g.statediagram-state, g.stateGroup, g.node[id^="state-"], g[id^="state-"]');
      if (node && svg.contains(node)) {
        const id = nodeIds.get(node);
        if (!id) return;
        if (connectionStart !== undefined) {
          if (connectionStart === '') {
            connectionStart = id;
            help.textContent = `Choose a destination for ${id}.`;
          } else if (connectionStart !== id) {
            const from = connectionStart;
            connectionStart = undefined;
            mutate((source) => addStateTransition(source, from, id));
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
      }
    };
    svg.addEventListener('click', click);
    return () => {
      if (!active) return;
      active = false;
      svg.removeEventListener('click', click);
      toolbar.replaceChildren();
      selected = null;
      context.setSelection(null);
    };
  },
};
