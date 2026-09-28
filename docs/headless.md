# Headless package

UI-independent Mermaid editing state and source mutation tools.

## Install

```sh
npm install @mermaid-editor-sdk/headless
# or
pnpm add @mermaid-editor-sdk/headless
# or
yarn add @mermaid-editor-sdk/headless
```

## Build one editor component

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

## API reference

### Core exports

```ts
import {
  AmbiguousSourceMutationError,
  DiagramSession,
  EditorController,
  SourceDocument,
  addFlowchartNode,
  appendPaletteEntry,
  appendSourceLines,
  classifyDiagram,
  diagramTypeFromSource,
  getDiagramElementIdForSelection,
  withParseResult,
  withPreviewResult,
  diagramTypes,
  paletteCatalog,
  templates,
} from '@mermaid-editor-sdk/headless';
import type {
  ChangeOrigin,
  DiagramAction,
  DiagramCapability,
  DiagramEdge,
  DiagramElement,
  DiagramNode,
  DiagramSemanticElement,
  DiagramType,
  EditorSelection,
  EditableDiagramType,
  FlowchartNodeShape,
  PaletteEntry,
  PaletteGroup,
  RendererModel,
  SessionSnapshot,
  SourceRegion,
  SourceRegionKind,
} from '@mermaid-editor-sdk/headless';
```

The package also exports diagram-specific source helpers and palette item types for flowchart, sequence, class, state, ER, Gantt, pie, journey, mindmap, git graph, timeline, and quadrant diagrams.

### `DiagramSession(initialSource)`

| Argument | Description | Type | Default value |
|---|---|---|---|
| `initialSource` | Initial Mermaid source. | `string` | — |

### `DiagramSession` members

| Member | Description | Type | Default value |
|---|---|---|---|
| `store` | Vanilla Zustand store containing session snapshots. | `StoreApi<SessionSnapshot>` from `zustand/vanilla` | — |
| `getSnapshot()` | Returns the current session snapshot. | `() => SessionSnapshot` | — |
| `getServerSnapshot()` | Returns the initial snapshot for server rendering. | `() => SessionSnapshot` | — |
| `subscribe(listener)` | Subscribes to snapshot changes; returns an unsubscribe function. | `(listener: () => void) => () => void` | — |
| `setSource(source, origin?)` | Replaces source and updates history according to its origin. | `(source: string, origin?: ChangeOrigin) => boolean` | `origin: 'host'` |
| `dispatch(action)` | Applies a diagram action; returns the new source if changed. | `(action: DiagramAction) => string \| undefined` | — |
| `setParseResult(sourceRevision, valid)` | Updates parse state if the revision is current. | `(sourceRevision: number, valid: boolean) => void` | — |
| `undo()` | Restores the previous source, if available. | `() => string \| undefined` | — |
| `redo()` | Restores the next source, if available. | `() => string \| undefined` | — |

### `EditorController(initialSource, onChange?)`

| Argument | Description | Type | Default value |
|---|---|---|---|
| `initialSource` | Initial Mermaid source. | `string` | — |
| `onChange?` | Called when a non-host source change is published. | `(source: string) => void` | — |

### `EditorController` members

| Member | Description | Type | Default value |
|---|---|---|---|
| `session` | Underlying `DiagramSession`. | `DiagramSession` | — |
| `start()` | Starts forwarding session changes to `onChange`. | `() => void` | — |
| `stop()` | Stops forwarding changes. | `() => void` | — |
| `setOnChange(callback?)` | Replaces the change callback. | `(callback?: (source: string) => void) => void` | — |
| `setHostValue(source)` | Applies a host value without publishing it as an edit. | `(source: string) => void` | — |
| `setSource(source, origin?)` | Updates the source. | `(source: string, origin?: ChangeOrigin) => boolean` | `origin: 'source-editor'` |
| `dispatch(action)` | Applies a diagram action. | `(action: DiagramAction) => string \| undefined` | — |
| `undo()` / `redo()` | Moves through source history. | `() => string \| undefined` | — |

### `DiagramAction`

Pass actions to `DiagramSession.dispatch()` or `EditorController.dispatch()`.

```ts
session.dispatch({ type: 'create-node', label: 'Review' });
session.dispatch({
  type: 'create-edge',
  source: 'Start',
  target: 'Review',
  label: 'next',
});
```

Actions are validated against the current diagram type. Unsupported actions throw; an unchanged or non-editable diagram returns `undefined`.

### `SourceDocument(source, diagramType)`

| Argument | Description | Type | Default value |
|---|---|---|---|
| `source` | Mermaid source to inspect. | `string` | — |
| `diagramType` | Diagram type used to classify source regions. | `DiagramType` | — |

### `SourceDocument` members

| Member | Description | Type | Default value |
|---|---|---|---|
| `source` | Original Mermaid source. | `string` | — |
| `regions` | Source spans, including statements, comments, metadata, and opaque text. | `readonly SourceRegion[]` | — |
| `replaceStatement(start, end, replacement)` | Replaces one safe flowchart node statement. | `(start: number, end: number, replacement: string) => string` | — |
| `findUniqueEditableStatement(statement)` | Finds one matching editable statement. | `(statement: string) => SourceRegion` | — |
| `serializeMutation(candidate)` | Applies a candidate while preserving protected source regions. | `(candidate: string) => string` | — |

### `appendSourceLines(source, additions, diagramType)`

| Argument | Description | Type | Default value |
|---|---|---|---|
| `source` | Mermaid source to update. | `string` | — |
| `additions` | Statements to append. | `readonly string[]` | — |
| `diagramType` | Type used to identify the diagram header. | `DiagramType` | — |
| Return value | Source with additions placed before trailing comments and whitespace. | `string` | — |

### `getDiagramElementIdForSelection(elements, selection)`

| Argument | Description | Type | Default value |
|---|---|---|---|
| `elements` | Diagram elements to search. | `readonly DiagramElement[]` | — |
| `selection` | Selected node, edge, or flowchart subgraph. | `EditorSelection` | — |
| Return value | Matching model element ID, if found. | `string \| undefined` | — |

### Diagram classification

```ts
type DiagramType =
  | 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'gantt'
  | 'pie' | 'journey' | 'mindmap' | 'gitgraph' | 'timeline' | 'quadrant'
  | 'unsupported' | 'unknown';

interface DiagramCapability {
  diagramType: DiagramType;
  parse: 'not-checked' | 'valid' | 'invalid';
  preview: 'pending' | 'available' | 'unavailable';
  editor: 'source-only' | 'visual';
}
```

| Function | Description | Type | Default value |
|---|---|---|---|
| `classifyDiagram(detectedType)` | Classifies a detected Mermaid diagram name. | `(detectedType: string \| undefined) => DiagramCapability` | — |
| `withParseResult(capability, valid)` | Adds parse status to a capability. | `(capability: DiagramCapability, valid: boolean) => DiagramCapability` | — |
| `withPreviewResult(capability, available)` | Adds preview availability after parsing. | `(capability: DiagramCapability, available: boolean) => DiagramCapability` | — |
| `diagramTypeFromSource(source)` | Detects an editable diagram type from source. | `(source: string) => EditableDiagramType \| undefined` | — |

### Diagram model

```ts
type ChangeOrigin = 'host' | 'source-editor' | 'diagram-action' | 'history';

interface SessionSnapshot {
  readonly codeBlock: { readonly source: string; readonly revision: number };
  readonly model: RendererModel;
  readonly origin: ChangeOrigin;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

interface RendererModel {
  readonly diagramType: DiagramType;
  readonly revision: number;
  readonly sourceRevision: number;
  readonly elements: readonly DiagramElement[];
  readonly parseState: 'pending' | 'parsed' | 'invalid' | 'unsupported' | 'unknown';
}
```

`DiagramNode`, `DiagramEdge`, `DiagramElement`, and `EditorSelection` describe model elements and selections.

### Diagram-specific source helpers

Direct source helpers are exported for operations outside `DiagramSession.dispatch()`. They take Mermaid source and return updated source; list and lookup helpers return parsed entries.

| Diagram type | Common exported helpers |
|---|---|
| Flowchart | `listFlowchartNodes`, `listFlowchartEdges`, `addFlowchartNode`, `setFlowchartNode`, `deleteFlowchartNode`, `addFlowchartEdge`, `setFlowchartEdge`, `deleteFlowchartEdge`, `addFlowchartSubgraph`, `setFlowchartSubgraph`, `deleteFlowchartSubgraph` |
| Class | `listClassIds`, `listClassRelations`, `addClassNode`, `renameClassNode`, `deleteClassNode`, `addClassRelation`, `setClassRelation`, `deleteClassRelation`, `addClassMember`, `setClassMember`, `deleteClassMember` |
| State | `listStateIds`, `listStateTransitions`, `addState`, `renameState`, `deleteState`, `addStateTransition`, `setStateTransition`, `deleteStateTransition` |
| ER | `listEREntityIds`, `listERRelationships`, `listERAttributes`, `addEREntity`, `renameEREntity`, `deleteEREntity`, `addERRelationship`, `setERRelationship`, `deleteERRelationship`, `addERAttribute`, `setERAttribute`, `deleteERAttribute` |
| Other diagram types | Palette helpers, catalogs, and diagram-specific mutations are exported for sequence, Gantt, pie, journey, mindmap, git graph, timeline, and quadrant diagrams. |

The package also exports `diagramTypes`, `templates`, `paletteCatalog`, `appendPaletteEntry`, and diagram-specific palette item types.
