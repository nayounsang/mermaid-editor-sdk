[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / RendererModel

# Interface: RendererModel

Defined in: package/headless/dist/core/diagram-model.d.ts:114

Parsed diagram state used by the UI and selection tools.

## Properties

### diagramType

> `readonly` **diagramType**: [`DiagramType`](../type-aliases/DiagramType.md)

Defined in: package/headless/dist/core/diagram-model.d.ts:116

Detected Mermaid diagram type.

***

### elements

> `readonly` **elements**: readonly [`DiagramElement`](../type-aliases/DiagramElement.md)[]

Defined in: package/headless/dist/core/diagram-model.d.ts:122

Renderable nodes, edges, subgraphs, and semantic elements.

***

### parseState

> `readonly` **parseState**: `"unsupported"` \| `"unknown"` \| `"invalid"` \| `"pending"` \| `"parsed"`

Defined in: package/headless/dist/core/diagram-model.d.ts:124

Current parser state for the source.

***

### revision

> `readonly` **revision**: `number`

Defined in: package/headless/dist/core/diagram-model.d.ts:118

Revision of this model snapshot.

***

### sourceRevision

> `readonly` **sourceRevision**: `number`

Defined in: package/headless/dist/core/diagram-model.d.ts:120

Source revision from which this model was created.
