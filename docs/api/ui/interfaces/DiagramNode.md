[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / DiagramNode

# Interface: DiagramNode

Defined in: package/headless/dist/core/diagram-model.d.ts:46

Renderable node in a parsed diagram model.

## Properties

### attributes

> `readonly` **attributes**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: package/headless/dist/core/diagram-model.d.ts:58

Renderer attributes associated with the node.

***

### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

Defined in: package/headless/dist/core/diagram-model.d.ts:52

Diagram syntax represented by the node.

***

### id

> `readonly` **id**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:48

Stable model identifier for the node.

***

### kind

> `readonly` **kind**: `"node"`

Defined in: package/headless/dist/core/diagram-model.d.ts:50

Discriminant identifying this element as a node.

***

### label

> `readonly` **label**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:54

Display label.

***

### shape?

> `readonly` `optional` **shape?**: [`FlowchartNodeShape`](../type-aliases/FlowchartNodeShape.md)

Defined in: package/headless/dist/core/diagram-model.d.ts:56

Flowchart node shape, when applicable.
