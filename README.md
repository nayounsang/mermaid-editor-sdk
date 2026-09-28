# Mermaid Editor SDK

Build Mermaid editors with the React UI package or compose your own interface from the headless editing logic.

| Package | Use it for | Docs |
|---|---|---|
| `@mermaid-editor-sdk/ui` | A ready-to-use React editor with customizable components and full SDK. | [UI guide](docs/ui.md) |
| `@mermaid-editor-sdk/headless` | Headless APIs for building a Mermaid editor from scratch. | [Headless guide](docs/headless.md) |

## Quick start

### Install

```sh
pnpm add @mermaid-editor-sdk/ui
```

```sh
pnpm add @mermaid-editor-sdk/headless
```

### Use full SDK

```tsx
import { useState } from 'react';
import { MermaidEditor } from '@mermaid-editor-sdk/ui';
import '@mermaid-editor-sdk/ui/style.css';

export function App() {
  const [source, setSource] = useState('flowchart LR\n  Start --> Done');
  return <MermaidEditor value={source} onChange={setSource} />;
}
```

### Custom UI

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

### Build with headless APIs


```ts
import { DiagramSession } from '@mermaid-editor-sdk/headless';

const session = new DiagramSession('flowchart LR\n  Start --> Done');
session.dispatch({ type: 'create-node', label: 'Review' });

const { codeBlock, model } = session.getSnapshot();
```

See the [Headless guide](docs/headless.md) for a custom component example and API reference.

## Development

See [Development Guide](docs/development.md)
