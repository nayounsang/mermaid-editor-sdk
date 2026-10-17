[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / DiagramEdge

# Interface: DiagramEdge

Defined in: package/headless/dist/core/diagram-model.d.ts:61

Renderable relationship in a parsed diagram model.

## Properties

### attributes

> `readonly` **attributes**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: package/headless/dist/core/diagram-model.d.ts:79

Renderer attributes associated with the edge.

***

### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

Defined in: package/headless/dist/core/diagram-model.d.ts:67

Diagram syntax represented by the edge.

***

### id

> `readonly` **id**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:63

Stable model identifier for the edge.

***

### kind

> `readonly` **kind**: `"edge"`

Defined in: package/headless/dist/core/diagram-model.d.ts:65

Discriminant identifying this element as an edge.

***

### label

> `readonly` **label**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:75

Relationship label.

***

### occurrence

> `readonly` **occurrence**: `number`

Defined in: package/headless/dist/core/diagram-model.d.ts:77

Zero-based occurrence among equivalent relationships.

***

### operator

> `readonly` **operator**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:73

Mermaid relationship operator.

***

### source

> `readonly` **source**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:69

Source node identifier.

***

### target

> `readonly` **target**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:71

Target node identifier.
