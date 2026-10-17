[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / RendererModel

# Interface: RendererModel

Defined in: [core/diagram-model.ts:127](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L127)

Parsed diagram state used by the UI and selection tools.

## Properties

### diagramType

> `readonly` **diagramType**: [`DiagramType`](../type-aliases/DiagramType.md)

Defined in: [core/diagram-model.ts:129](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L129)

Detected Mermaid diagram type.

***

### elements

> `readonly` **elements**: readonly [`DiagramElement`](../type-aliases/DiagramElement.md)[]

Defined in: [core/diagram-model.ts:135](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L135)

Renderable nodes, edges, subgraphs, and semantic elements.

***

### parseState

> `readonly` **parseState**: `"unsupported"` \| `"unknown"` \| `"invalid"` \| `"pending"` \| `"parsed"`

Defined in: [core/diagram-model.ts:137](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L137)

Current parser state for the source.

***

### revision

> `readonly` **revision**: `number`

Defined in: [core/diagram-model.ts:131](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L131)

Revision of this model snapshot.

***

### sourceRevision

> `readonly` **sourceRevision**: `number`

Defined in: [core/diagram-model.ts:133](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L133)

Source revision from which this model was created.
