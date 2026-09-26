# Mermaid Visual Editor SDK

React component and source editing utilities for Mermaid diagrams. The main package entry exports the React editor; React and ReactDOM 18 or 19 are peer dependencies.

```sh
npm install mermaid-visual-editor-sdk react react-dom
```

```tsx
import { useState } from 'react';
import { MermaidEditor } from 'mermaid-visual-editor-sdk';
import 'mermaid-visual-editor-sdk/style.css';

const initialValue = `flowchart TD
  Start --> Review
  Review --> Done`;

export function DiagramPage() {
  const [value, setValue] = useState(initialValue);

  return <MermaidEditor value={value} onChange={setValue} />;
}
```

`value` is the complete Mermaid source block. Host updates are applied without calling `onChange`; source edits and diagram actions call it with the new source. Pass `onSave` to enable the Save action. `onError` reports parse, render, mutation, and save errors. The editor also accepts `onSelectionChange`, `onReset`, and `onRemove` callbacks.

The React editor renders its initial shell during server rendering and starts Mermaid rendering after it mounts in a browser. Import the stylesheet once in the application entry point.

The React component is also available from `mermaid-visual-editor-sdk/react`. The previous imperative factory remains available from the package root for existing consumers and from `mermaid-visual-editor-sdk/legacy` as an explicit compatibility entry. The browser IIFE continues to expose that factory as `MermaidVisualEditor.createMermaidVisualEditor`.

For local development, run `npm install` and `npm run dev`. Run `npm run build` to build the React package and the browser IIFE.
