import type { AdapterDiagramType, DiagramAdapter } from './adapter';

import type { PaletteGroup } from '../source/palette-source';

/** Shared click/drop lifecycle for diagrams whose baseline UI is a snippet palette. */
export function createPaletteAdapter<Id extends string>(
  diagramType: AdapterDiagramType,
  palette: readonly PaletteGroup<Id>[],
  mutate: (source: string, itemId: Id) => string,
): DiagramAdapter {
  const dragType = `application/x-mve-${diagramType}-palette`;
  const validItems = new Set<string>(palette.flatMap(({ items }) => items.map(({ id }) => id)));
  return {
    diagramType,
    mount(context) {
      const document = context.toolbar.ownerDocument;
      let disposed = false;
      const insert = (id: Id): void => {
        if (!disposed) context.applySourceMutation((source) => mutate(source.source, id));
      };
      const groups = palette.map((group) => {
        const section = document.createElement('section');
        section.className = 'mve-palette-group';
        const heading = document.createElement('h3');
        heading.textContent = group.title;
        const items = document.createElement('div');
        items.className = 'mve-palette-group-items';
        for (const item of group.items) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mve-palette-item';
          button.title = item.snippet;
          button.setAttribute('aria-label', `Add ${item.label.toLowerCase()}`);
          const label = document.createElement('span');
          label.textContent = item.label;
          const icon = document.createElement('span');
          icon.className = 'mve-palette-icon';
          icon.textContent = item.icon;
          button.append(label, icon);
          button.draggable = true;
          button.addEventListener('click', () => insert(item.id));
          button.addEventListener('dragstart', (event) => {
            if (disposed || !event.dataTransfer) return;
            event.dataTransfer.setData(dragType, item.id);
            event.dataTransfer.effectAllowed = 'copy';
          });
          items.append(button);
        }
        section.append(heading, items);
        return section;
      });
      context.toolbar.replaceChildren(...groups);
      const dragOver = (event: DragEvent): void => {
        if (event.dataTransfer?.types.includes(dragType)) event.preventDefault();
      };
      const drop = (event: DragEvent): void => {
        const id = event.dataTransfer?.getData(dragType);
        if (!id || !validItems.has(id)) return;
        event.preventDefault();
        insert(id as Id);
      };
      context.svg.addEventListener('dragover', dragOver);
      context.svg.addEventListener('drop', drop);
      return () => {
        disposed = true;
        context.svg.removeEventListener('dragover', dragOver);
        context.svg.removeEventListener('drop', drop);
        context.toolbar.replaceChildren();
      };
    },
  };
}
