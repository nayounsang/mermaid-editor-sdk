[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / DiagramNode

# Interface: DiagramNode

Defined in: [core/diagram-model.ts:54](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L54)

Renderable node in a parsed diagram model.

## Properties

### attributes

> `readonly` **attributes**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/diagram-model.ts:66](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L66)

Renderer attributes associated with the node.

***

### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

Defined in: [core/diagram-model.ts:60](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L60)

Diagram syntax represented by the node.

***

### id

> `readonly` **id**: `string`

Defined in: [core/diagram-model.ts:56](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L56)

Stable model identifier for the node.

***

### kind

> `readonly` **kind**: `"node"`

Defined in: [core/diagram-model.ts:58](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L58)

Discriminant identifying this element as a node.

***

### label

> `readonly` **label**: `string`

Defined in: [core/diagram-model.ts:62](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L62)

Display label.

***

### shape?

> `readonly` `optional` **shape?**: [`FlowchartNodeShape`](../type-aliases/FlowchartNodeShape.md)

Defined in: [core/diagram-model.ts:64](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L64)

Flowchart node shape, when applicable.
