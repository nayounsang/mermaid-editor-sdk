# Mermaid Editor SDK documentation

Use the UI package for a ready-to-use React editor. Use the headless package to build your own editor interface around Mermaid source and diagram editing logic.

## UI package

### Install

```sh
npm install @mermaid-editor-sdk/ui react react-dom
# or
pnpm add @mermaid-editor-sdk/ui react react-dom
# or
yarn add @mermaid-editor-sdk/ui react react-dom
```

`react` and `react-dom` are peer dependencies.

### Full SDK

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

### Customization

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

### API reference

See the [UI package API reference](/docs/api/ui).

## Headless package

UI-independent Mermaid editing state and source mutation tools.

### Install

```sh
npm install @mermaid-editor-sdk/headless
# or
pnpm add @mermaid-editor-sdk/headless
# or
yarn add @mermaid-editor-sdk/headless
```

### Build one editor component

Use `DiagramSession` to make a source editor component. The session provides an observable snapshot and records edits for undo and redo.

```tsx
import { useSyncExternalStore } from 'react';
import { DiagramSession } from '@mermaid-editor-sdk/headless';

const session = new DiagramSession('flowchart LR\n  Start --> Done');

function SourceEditor({ session }: { session: DiagramSession }) {
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );

  return (
    <textarea
      aria-label="Mermaid source"
      value={snapshot.codeBlock.source}
      onChange={(event) => session.setSource(event.currentTarget.value, 'source-editor')}
    />
  );
}

export function App() {
  return <SourceEditor session={session} />;
}
```

### API reference

See the [Headless package API reference](/docs/api/headless).
