import type { DiagramAdapter, DiagramAdapterContext } from './adapter';
import { addSequencePaletteItem, type SequencePaletteItemId } from '../source/sequence-mutations';

interface SequencePaletteItem {
  id: SequencePaletteItemId;
  label: string;
  icon: string;
}

interface SequencePaletteGroup {
  title: string;
  items: readonly SequencePaletteItem[];
}

export const sequencePalette: readonly SequencePaletteGroup[] = [
  { title: 'Actors', items: [
    { id: 'participant', label: 'Participant', icon: 'p' },
    { id: 'actor', label: 'Actor', icon: 'a' },
  ] },
  { title: 'Messages', items: [
    { id: 'message-sync', label: 'Message (sync)', icon: '->>' },
    { id: 'message-reply', label: 'Reply (dashed)', icon: '-->>' },
    { id: 'message-activate', label: 'Activate', icon: '->>+' },
    { id: 'message-deactivate', label: 'Deactivate', icon: '-->>-' },
    { id: 'message-async', label: 'Async', icon: '-)' },
  ] },
  { title: 'Blocks', items: [
    { id: 'note', label: 'Note', icon: 'note' },
    { id: 'loop', label: 'Loop', icon: 'loop' },
    { id: 'alt', label: 'Alt / else', icon: 'alt' },
    { id: 'opt', label: 'Opt', icon: 'opt' },
    { id: 'parallel', label: 'Parallel', icon: 'par' },
  ] },
];

const DRAG_TYPE = 'application/x-mve-sequence-palette';

export const sequenceAdapter: DiagramAdapter = {
  diagramType: 'sequence',
  mount(context: DiagramAdapterContext): () => void {
    const document = context.toolbar.ownerDocument;
    const groups: HTMLElement[] = [];
    const itemsById = new Map<SequencePaletteItemId, SequencePaletteItem>();
    for (const group of sequencePalette) {
      const section = document.createElement('section');
      section.className = 'mve-sequence-group';
      const heading = document.createElement('h3');
      heading.className = 'mve-sequence-group-title';
      heading.textContent = group.title;
      const tools = document.createElement('div');
      tools.className = 'mve-sequence-group-items';
      for (const item of group.items) {
        itemsById.set(item.id, item);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mve-sequence-item';
        const label = document.createElement('span');
        label.textContent = item.label;
        const icon = document.createElement('span');
        icon.className = 'mve-palette-icon';
        icon.textContent = item.icon;
        button.append(label, icon);
        button.setAttribute('aria-label', `Add ${item.label.toLowerCase()}`);
        button.draggable = true;
        button.addEventListener('click', () => {
          context.applySourceMutation((source) => addSequencePaletteItem(source.source, item.id));
        });
        button.addEventListener('dragstart', (event) => {
          event.dataTransfer?.setData(DRAG_TYPE, item.id);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
        });
        tools.append(button);
      }
      section.append(heading, tools);
      groups.push(section);
    }
    context.toolbar.replaceChildren(...groups);

    const dragOver = (event: DragEvent): void => {
      if (event.dataTransfer?.types.includes(DRAG_TYPE)) event.preventDefault();
    };
    const drop = (event: DragEvent): void => {
      const itemId = event.dataTransfer?.getData(DRAG_TYPE) as SequencePaletteItemId | undefined;
      if (!itemId || !itemsById.has(itemId)) return;
      event.preventDefault();
      context.applySourceMutation((source) => addSequencePaletteItem(source.source, itemId));
    };
    context.svg.addEventListener('dragover', dragOver);
    context.svg.addEventListener('drop', drop);

    return () => {
      context.svg.removeEventListener('dragover', dragOver);
      context.svg.removeEventListener('drop', drop);
      context.toolbar.replaceChildren();
    };
  },
};
