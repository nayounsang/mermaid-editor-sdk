# UI package

## Install

```sh
npm install @mermaid-editor-sdk/ui react react-dom
# or
pnpm add @mermaid-editor-sdk/ui react react-dom
# or
yarn add @mermaid-editor-sdk/ui react react-dom
```

`react` and `react-dom` are peer dependencies.

## Full SDK

All features and the UI are provided.

```tsx
import { useState } from 'react';
import { MermaidEditor } from '@mermaid-editor-sdk/ui';
import '@mermaid-editor-sdk/ui/style.css';

export function App() {
  const [source, setSource] = useState('flowchart LR\n  Start --> Done');
  return <MermaidEditor value={source} onChange={setSource} />;
}
```

## Customization

With no children, `MermaidEditor` renders the complete default UI. Providing children replaces that composition. Use `useMermaidEditorParts()` to keep the SDK components you want and pass their props to custom replacements.

This example keeps the SDK sidebar, diagram picker, canvas, selection editor, and status. It replaces only the source editor.

```tsx
import { useState } from 'react';
import {
  DiagramTypeSelect,
  EditorShell,
  EditorStatus,
  MermaidCanvas,
  MermaidEditor,
  SelectionEditor,
  ToolSidebar,
  type SourceEditorProps,
  useMermaidEditorParts,
} from '@mermaid-editor-sdk/ui';
import '@mermaid-editor-sdk/ui/style.css';

function CustomSource({ value, onChange }: SourceEditorProps) {
  return <textarea aria-label="Mermaid source" value={value}
    onChange={(event) => onChange(event.currentTarget.value)} />;
}

function EditorLayout() {
  const parts = useMermaidEditorParts();
  return <EditorShell {...parts.shell}>
    <EditorShell.Sidebar><ToolSidebar {...parts.toolbar} /></EditorShell.Sidebar>
    <EditorShell.HeaderControls><DiagramTypeSelect {...parts.diagramTypeSelect} /></EditorShell.HeaderControls>
    <EditorShell.Canvas><MermaidCanvas {...parts.canvas} /></EditorShell.Canvas>
    <EditorShell.Selection><SelectionEditor {...parts.selectionEditor} /></EditorShell.Selection>
    <EditorShell.Source><CustomSource {...parts.sourceEditor} /></EditorShell.Source>
    <EditorShell.Status><EditorStatus {...parts.status} /></EditorShell.Status>
  </EditorShell>;
}

export function App() {
  const [source, setSource] = useState('flowchart LR\n  Start --> Done');
  return <MermaidEditor value={source} onChange={setSource}>
    <EditorLayout />
  </MermaidEditor>;
}
```

The `EditorShell` regions are direct children; wrappers go inside each region. Omit a region to hide it. `ToolSidebar.paletteComponent` can replace only the palette while keeping the SDK sidebar.

## API reference

See [api/ui/README.md](api/ui/README.md).
