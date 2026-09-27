# Mermaid Visual Editor SDK

The SDK ships as two packages: `mermaid-visual-editor-sdk` provides a complete React editor and composable React UI parts; `@mermaid-editor/headless` provides the session, diagram model, and Mermaid source editing logic without a UI. The Vite example under `app/example` consumes the UI package through its public package entry.

## Full React editor

```sh
pnpm add mermaid-visual-editor-sdk react react-dom
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

`value` is one complete Mermaid code block. Host updates apply without calling `onChange`; source edits and diagram actions call it with the new source. Pass `onSave` to enable the Save action. `onError`, `onSelectionChange`, `onReset`, and `onRemove` are also available.

The React editor renders its initial shell during server rendering and starts Mermaid rendering after it mounts in a browser. Import the stylesheet once in the application entry point.

## Compose the UI parts

The Provider and state hook are available from `mermaid-visual-editor-sdk/provider`. UI parts can also be imported independently from `/toolbar`, `/source`, `/renderer`, or `/components`.

```tsx
import { useState } from 'react';
import { EditorController } from '@mermaid-editor/headless';
import {
  EditorSessionProvider,
  useDiagramSession,
} from 'mermaid-visual-editor-sdk/provider';
import { ToolSidebar } from 'mermaid-visual-editor-sdk/toolbar';
import { SourceEditor } from 'mermaid-visual-editor-sdk/source';
import 'mermaid-visual-editor-sdk/style.css';

function CustomControls() {
  const { snapshot, dispatch } = useDiagramSession();
  // Place SDK controls in your own React layout and style the surrounding app.
  return <ToolSidebar
    model={snapshot.model}
    dispatch={dispatch}
    onArmConnection={() => {}}
  />;
}

function CustomPanels() {
  const { snapshot, setSource } = useDiagramSession();
  return <SourceEditor
    value={snapshot.codeBlock.source}
    onChange={(source) => setSource(source, 'source-editor')}
  />;
}

export function CustomEditor({ value }: { value: string }) {
  const [controller] = useState(() => new EditorController(value));
  return <EditorSessionProvider controller={controller}>
    <CustomControls />
    <CustomPanels />
  </EditorSessionProvider>;
}
```

The component subpath exports include the full typed props for `MermaidCanvas`, `ToolSidebar`, `DiagramPalette`, `SourceEditor`, `SelectionEditor`, status, and diagram type controls. The canvas uses the SDK's Mermaid SVG renderer and adapter interaction layer.

## Build a custom headless editor

Install only the logic package to provide your own view and styles:

```sh
pnpm add @mermaid-editor/headless
```

```ts
import { DiagramSession } from '@mermaid-editor/headless';

const session = new DiagramSession('flowchart TD\n  Start --> Done');
const stopListening = session.subscribe(() => {
  const { codeBlock, model } = session.getSnapshot();
  // Render these values with your own framework, components, and stylesheet.
});

session.dispatch({ type: 'create-node', id: 'Review', label: 'Review' });
stopListening();
```

The headless package has no React, ReactDOM, CSS, or browser DOM dependency. Its exports include session and controller contracts, diagram models, source document safety utilities, templates, and source mutation functions.

## Compatibility and development

The existing imperative API remains available from the package root and `mermaid-visual-editor-sdk/legacy`. The browser IIFE continues to expose `MermaidVisualEditor.createMermaidVisualEditor`.

```sh
pnpm install --frozen-lockfile
pnpm dev          # Vite app with HMR for workspace package source
pnpm build        # Turbo build graph: headless -> UI -> example
pnpm typecheck
pnpm lint
pnpm test
```

See [the monorepo design](docs/monorepo-design.md) and [development guide](docs/development.md) for package boundaries, exports, and workflow.
