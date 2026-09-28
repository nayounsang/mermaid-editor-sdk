import type { DiagramAdapter } from './adapter';
import { addGanttPaletteItem, ganttPalette, type GanttPaletteItemId } from '@mermaid-editor-sdk/headless';

const DRAG_TYPE = 'application/x-mve-gantt-palette';

export const ganttAdapter: DiagramAdapter = {
  diagramType: 'gantt',
  mount(context) {
    const document = context.toolbar.ownerDocument;
    const groups: HTMLElement[] = [];
    const itemsById = new Map<GanttPaletteItemId, string>();
    for (const group of ganttPalette) {
      const section = document.createElement('section');
      section.className = 'mve-gantt-group';
      const heading = document.createElement('h3');
      heading.className = 'mve-gantt-group-title';
      heading.textContent = group.title;
      const tools = document.createElement('div');
      tools.className = 'mve-gantt-group-items';
      for (const item of group.items) {
        itemsById.set(item.id, item.label);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mve-gantt-item';
        const label = document.createElement('span');
        label.textContent = item.label;
        const icon = document.createElement('span');
        icon.className = 'mve-palette-icon';
        icon.textContent = item.icon;
        button.append(label, icon);
        button.title = item.snippet;
        button.setAttribute('aria-label', `Add ${item.label.toLowerCase()}`);
        button.draggable = true;
        button.addEventListener('click', () => {
          context.applySourceMutation((source) => addGanttPaletteItem(source.source, item.id));
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
      const itemId = event.dataTransfer?.getData(DRAG_TYPE) as GanttPaletteItemId | undefined;
      if (!itemId || !itemsById.has(itemId)) return;
      event.preventDefault();
      context.applySourceMutation((source) => addGanttPaletteItem(source.source, itemId));
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
