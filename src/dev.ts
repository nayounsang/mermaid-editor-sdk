import { createMermaidVisualEditor } from './index';
import './styles/dev.css';

const initialSource = `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Ship it]
    B -->|No| D[Debug]
    D --> B`;

const storageKey = 'mve-playground-diagram';
const editor = createMermaidVisualEditor(document.querySelector<HTMLElement>('#editor')!, {
  value: window.localStorage.getItem(storageKey) ?? initialSource,
  onSave(source) {
    window.localStorage.setItem(storageKey, source);
  },
});

window.addEventListener('pagehide', () => editor.destroy(), { once: true });
