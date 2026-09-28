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

### Exports

```tsx
import {
  createMermaidVisualEditor,
  EditorController,
  MermaidEditor,
  SourceDocument,
  useMermaidEditorParts,
  useEditorController,
  useDiagramSession,
} from '@mermaid-editor-sdk/ui';
import type {
  ChangeOrigin,
  DiagramAction,
  DiagramEdge,
  DiagramElement,
  DiagramNode,
  DiagramSemanticElement,
  DiagramType,
  EditableDiagramType,
  EditorError,
  EditorSelection,
  FlowchartNodeShape,
  MermaidEditorParts,
  MermaidEditorProps,
  MermaidVisualEditor,
  MermaidVisualEditorOptions,
  RendererModel,
  SessionSnapshot,
} from '@mermaid-editor-sdk/ui';

import {
  DiagramPalette,
  DiagramTypeSelect,
  EditorShell,
  EditorStatus,
  MermaidCanvas,
  SelectionEditor,
  SourceEditor,
  ToolSidebar,
} from '@mermaid-editor-sdk/ui/components';
import type {
  DiagramPaletteProps,
  DiagramTypeSelectProps,
  EdgeConnectionOptions,
  EditorShellComponent,
  EditorShellProps,
  EditorStatusProps,
  EditorStatusState,
  MermaidCanvasProps,
  SelectionEditorProps,
  SourceEditorProps,
  ToolSidebarProps,
} from '@mermaid-editor-sdk/ui/components';

import { EditorSessionProvider } from '@mermaid-editor-sdk/ui/provider';
import type { EditorSessionProviderProps } from '@mermaid-editor-sdk/ui/provider';
```

All component prop types shown below are exported from the package root; standalone UI component types are also exported from `/components`.

### `createMermaidVisualEditor(container, options)`

Creates a visual editor in an existing DOM element.

| Argument | Description | Type | Default value |
|---|---|---|---|
| `container` | HTML element that receives the editor. | `HTMLElement` | — |
| `options` | Initial source and optional event callbacks. | `MermaidVisualEditorOptions` | — |
| Return value | Editor instance. | `MermaidVisualEditor` | — |

### `MermaidVisualEditorOptions`

| Property | Description | Type | Default value |
|---|---|---|---|
| `value` | Initial Mermaid source. | `string` | — |
| `onChange?` | Called when the source changes. | `(value: string) => void` | — |
| `onSelectionChange?` | Called when the selection changes or clears. | `(selection: EditorSelection \| null) => void` | — |
| `onError?` | Receives parse, render, mutation, save, or lifecycle errors. | `(error: EditorError) => void` | — |
| `onSave?` | Called by Save with the current source. | `(currentSource: string) => void \| Promise<void>` | — |
| `onReset?` | Called after Reset with the resulting source. | `(nextSource: string) => void \| Promise<void>` | — |
| `onRemove?` | Called after removal with the selection and resulting source. | `(selection: EditorSelection, nextSource: string) => void \| Promise<void>` | — |

### `MermaidVisualEditor`

| Method | Description | Type | Default value |
|---|---|---|---|
| `getValue()` | Returns the current source. | `() => string` | — |
| `setValue(value)` | Replaces the current source. | `(value: string) => void` | — |
| `destroy()` | Destroys the editor and releases its resources. | `() => void` | — |

### `useEditorController()`

Returns the current `EditorController`. Call inside `EditorSessionProvider` or `MermaidEditor`.

| Argument | Description | Type | Default value |
|---|---|---|---|
| — | No arguments. | — | — |
| Return value | Current editor controller. | `EditorController` | — |

### `useDiagramSession()`

Call inside `EditorSessionProvider` or `MermaidEditor`.

| Property | Description | Type | Default value |
|---|---|---|---|
| `snapshot` | Current session state. | `SessionSnapshot` | — |
| `dispatch` | Applies a diagram action; returns the resulting source when changed. | `(action: DiagramAction) => string \| undefined` | — |
| `undo` | Reverts the last source change. | `() => string \| undefined` | — |
| `redo` | Reapplies the next source change. | `() => string \| undefined` | — |
| `setSource` | Replaces source and optionally records its change origin. | `(source: string, origin?: ChangeOrigin) => boolean` | `origin: 'source-editor'` |

### `MermaidEditor`

```tsx
<MermaidEditor value={source} onChange={setSource} />
```

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `value` | Mermaid source controlled by the host. | `string` | — |
| `onChange?` | Called with edits made in the editor. Host value updates do not call it. | `(source: string) => void` | — |
| `onSelectionChange?` | Called when the selection changes or clears. | `(selection: EditorSelection \| null) => void` | — |
| `onError?` | Receives parse, render, mutation, save, or lifecycle errors. | `(error: EditorError) => void` | — |
| `onSave?` | Called by the Save action with the current source. | `(source: string) => void \| Promise<void>` | — |
| `onReset?` | Called after Reset with the resulting source. | `(nextSource: string) => void \| Promise<void>` | — |
| `onRemove?` | Called after removal with the selection and resulting source. | `(selection: EditorSelection, nextSource: string) => void \| Promise<void>` | — |
| `className?` | Class added to the default shell root. | `string` | `""` |
| `title?` | Default shell heading. | `string` | `"Diagram"` |
| `children?` | Custom composition; replaces the default UI when provided. | `ReactNode` | Default composition |

```ts
export interface EditorError {
  code: 'parse' | 'render' | 'mutation' | 'save' | 'destroyed';
  message: string;
  cause?: unknown;
}
```

### `useMermaidEditorParts()`

Call inside a `MermaidEditor` child. It returns:

```ts
export interface MermaidEditorParts {
  readonly shell: Omit<EditorShellProps, 'children'>;
  readonly toolbar: ToolSidebarProps;
  readonly diagramPalette: DiagramPaletteProps;
  readonly canvas: MermaidCanvasProps;
  readonly sourceEditor: SourceEditorProps;
  readonly selectionEditor: SelectionEditorProps;
  readonly status: EditorStatusProps;
  readonly diagramTypeSelect: DiagramTypeSelectProps;
}
```

### `EditorShell`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `title?` | Shell heading. | `string` | `"Diagram"` |
| `onKeyDown?` | Root keyboard event handler. | `(event: KeyboardEvent<HTMLDivElement>) => void` | — |
| `className?` | Additional class on the root. | `string` | `""` |
| `children?` | Compound region components. | `ReactNode` | — |

The exported compound region components share this prop:

| Component | Prop name | Description | Type | Default value |
|---|---|---|---|---|
| `EditorShell.Sidebar` | `children?` | Sidebar content. | `ReactNode` | — |
| `EditorShell.HeaderControls` | `children?` | Header controls. | `ReactNode` | — |
| `EditorShell.Actions` | `children?` | Header actions. | `ReactNode` | — |
| `EditorShell.Status` | `children?` | Status content. | `ReactNode` | — |
| `EditorShell.Canvas` | `children?` | Diagram canvas. | `ReactNode` | — |
| `EditorShell.Selection` | `children?` | Selection editor. | `ReactNode` | — |
| `EditorShell.Source` | `children?` | Source editor. | `ReactNode` | — |

### `ToolSidebar`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `model` | Current diagram model. | `RendererModel` | — |
| `dispatch` | Applies an editing action; returns the new source when changed. | `(action: DiagramAction) => string \| undefined` | — |
| `pendingConnection?` | Active relationship creation; `source` is set after choosing its source node. | `{ diagramType: EditableDiagramType; source?: string }` | — |
| `onArmConnection` | Starts or cancels relationship creation. | `(options: EdgeConnectionOptions \| null) => void` | — |
| `paletteComponent?` | Replaces the palette inside the SDK sidebar. | `ComponentType<DiagramPaletteProps>` | `DiagramPalette` |

### `DiagramPalette`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `model` | Current diagram model. | `RendererModel` | — |
| `dispatch` | Applies a palette action; returns the new source when changed. | `(action: DiagramAction) => string \| undefined` | — |
| `pendingConnection?` | Active relationship creation; `source` is set after choosing its source node. | `{ diagramType: EditableDiagramType; source?: string }` | — |
| `onArmConnection` | Starts or cancels relationship creation. | `(options: EdgeConnectionOptions \| null) => void` | — |

```ts
export type EdgeConnectionOptions = Omit<
  Extract<DiagramAction, { type: 'create-edge' }>,
  'type' | 'source' | 'target'
>;
```

### `DiagramTypeSelect`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `model` | Current diagram model and type. | `RendererModel` | — |
| `onChange` | Requests a change to an editable diagram type. | `(type: Exclude<DiagramType, 'unknown' \| 'unsupported'>) => void` | — |

### `EditorStatus`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `state` | Status key used for the `data-state` and accessibility role. | `EditorStatusState` | — |
| `message` | Accessible status message. | `string` | — |
| `error?` | Optional structured error details; not rendered by this component. | `EditorError` | — |

```ts
export type EditorStatusState =
  | 'loading'
  | 'empty'
  | 'error'
  | 'unsupported'
  | 'unknown'
  | 'source-only'
  | 'ready';
```

### `MermaidCanvas`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `source` | Mermaid source to render. | `string` | — |
| `sourceRevision` | Revision associated with `source`. | `number` | — |
| `model` | Parsed diagram model used for interactions. | `RendererModel` | — |
| `onSelection` | Reports the canvas selection or `null`. | `(selection: EditorSelection \| null) => void` | — |
| `onRenderState` | Reports render state, message, and optional cause. | `(state: EditorStatusState, message: string, cause?: unknown) => void` | — |
| `onSourceMutation` | Applies a source-preserving mutation; `remove` marks a removal operation. | `(mutate: (source: SourceDocument) => string, remove?: boolean) => boolean` | — |
| `onParseResult` | Reports whether a source revision parsed successfully. | `(sourceRevision: number, valid: boolean) => void` | — |
| `onSave` | Handles the canvas Save action. | `() => void` | — |
| `onReset` | Handles the canvas Reset action. | `() => void` | — |
| `onEditSelection` | Opens the selection editor. | `() => void` | — |
| `pendingConnection?` | Active relationship creation, with an optional selected source node. | `{ diagramType: EditableDiagramType; source?: string }` | — |

### `SourceEditor`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `value` | Source shown in the editor. | `string` | — |
| `onChange` | Reports edited source. | `(value: string) => void` | — |

### `SelectionEditor`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `open` | Whether the edit dialog is open. | `boolean` | — |
| `onClose` | Closes the dialog. | `() => void` | — |
| `selection` | Selected node, relationship, or subgraph; `null` when none is selected. | `EditorSelection \| null` | — |
| `model` | Current diagram model used to populate fields. | `RendererModel` | — |
| `dispatch` | Applies a selection edit; returns the new source when changed. | `(action: DiagramAction) => string \| undefined` | — |
| `onDelete?` | Called after a successful removal. | `(selection: EditorSelection, nextSource: string) => void \| Promise<void>` | — |

### `EditorSessionProvider`

| Prop name | Description | Type | Default value |
|---|---|---|---|
| `controller` | Session controller. | `EditorController` | — |
| `children` | Components that consume the session context. | `ReactNode` | — |
