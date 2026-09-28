import type { DiagramAdapter } from './adapter';
import { addPiePaletteItem, piePalette, type PiePaletteItemId } from '@mermaid-editor-sdk/headless';

const DRAG_TYPE = 'application/x-mve-pie-palette';

export const pieAdapter: DiagramAdapter = {
  diagramType: 'pie',
  mount(context) {
    const document = context.toolbar.ownerDocument;
    const validItems = new Set<PiePaletteItemId>(piePalette.flatMap(({ items }) => items.map(({ id }) => id)));
    const groups: HTMLElement[] = [];
    for (const group of piePalette) {
      const section = document.createElement('section');
      section.className = 'mve-pie-group';
      const heading = document.createElement('h3');
      heading.className = 'mve-pie-group-title';
      heading.textContent = group.title;
      const tools = document.createElement('div');
      tools.className = 'mve-pie-group-items';
      for (const item of group.items) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mve-pie-item';
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
          context.applySourceMutation((source) => addPiePaletteItem(source.source, item.id));
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
      const itemId = event.dataTransfer?.getData(DRAG_TYPE) as PiePaletteItemId | undefined;
      if (!itemId || !validItems.has(itemId)) return;
      event.preventDefault();
      context.applySourceMutation((source) => addPiePaletteItem(source.source, itemId));
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
