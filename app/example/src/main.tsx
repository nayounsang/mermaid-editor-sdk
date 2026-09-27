import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MermaidEditor } from 'mermaid-visual-editor-sdk';
import './dev.css';

const initialSource = `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Ship it]
    B -->|No| D[Debug]
    D --> B`;

const storageKey = 'mve-playground-diagram';
const mount = document.querySelector<HTMLElement>('#editor');
if (!mount) throw new Error('The editor mount element is missing.');
const root = createRoot(mount);
root.render(<StrictMode><MermaidEditor
  value={window.localStorage.getItem(storageKey) ?? initialSource}
  onSave={(source) => { window.localStorage.setItem(storageKey, source); }}
/></StrictMode>);
window.addEventListener('pagehide', () => root.unmount(), { once: true });
