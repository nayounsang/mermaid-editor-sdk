[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / MermaidCanvasProps

# Interface: MermaidCanvasProps

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:16](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L16)

## Properties

### autoFit?

> `readonly` `optional` **autoFit?**: `boolean`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:44](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L44)

Fits after rendering and resizing; the resulting zoom is clamped to 0.1–4.

#### Default

`false`

***

### flowchartEdgeOptions?

> `readonly` `optional` **flowchartEdgeOptions?**: `object`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:50](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L50)

Flowchart relationship operator and label used for the next edge.

#### label

> `readonly` **label**: `string`

#### operator

> `readonly` **operator**: `string`

#### Default

`{ operator: '-->', label: '' }`

***

### isSaving?

> `readonly` `optional` **isSaving?**: `boolean`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:36](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L36)

Disables Save and displays its pending state.

#### Default

`false`

***

### model

> `readonly` **model**: [`RendererModel`](RendererModel.md)

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:20](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L20)

Parsed diagram model used for interactions.

***

### onEditSelection

> `readonly` **onEditSelection**: () => `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:40](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L40)

Opens the selection editor.

#### Returns

`void`

***

### onParseResult

> `readonly` **onParseResult**: (`sourceRevision`, `valid`) => `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:30](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L30)

Reports whether a source revision parsed successfully.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceRevision` | `number` |
| `valid` | `boolean` |

#### Returns

`void`

***

### onRenderState

> `readonly` **onRenderState**: (`state`, `message`, `cause?`) => `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:24](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L24)

Reports render state, message, and optional underlying cause.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `state` | [`EditorStatusState`](../type-aliases/EditorStatusState.md) |
| `message` | `string` |
| `cause?` | `unknown` |

#### Returns

`void`

***

### onReset

> `readonly` **onReset**: () => `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:38](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L38)

Handles the canvas Reset action.

#### Returns

`void`

***

### onSave?

> `readonly` `optional` **onSave?**: () => `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:32](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L32)

Handles the canvas Save action.

#### Returns

`void`

***

### onSelection

> `readonly` **onSelection**: (`selection`) => `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:22](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L22)

Reports the selected node, edge, or subgraph, or `null` when selection clears.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selection` | [`EditorSelection`](../type-aliases/EditorSelection.md) \| `null` |

#### Returns

`void`

***

### onSourceMutation

> `readonly` **onSourceMutation**: (`mutate`, `remove?`) => `boolean`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:26](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L26)

Applies a source-preserving mutation; `remove` marks a removal operation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `mutate` | (`source`) => `string` |
| `remove?` | `boolean` |

#### Returns

`boolean`

***

### pendingConnection?

> `readonly` `optional` **pendingConnection?**: `object`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:46](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L46)

Active relationship creation, with an optional selected source node.

#### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

#### source?

> `readonly` `optional` **source?**: `string`

***

### source

> `readonly` **source**: `string`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:18](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L18)

Mermaid source to render.

***

### sourceRevision

> `readonly` **sourceRevision**: `number`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:28](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L28)

Revision associated with `source`.
