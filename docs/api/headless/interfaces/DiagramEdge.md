[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / DiagramEdge

# Interface: DiagramEdge

Defined in: [core/diagram-model.ts:70](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L70)

Renderable relationship in a parsed diagram model.

## Properties

### attributes

> `readonly` **attributes**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/diagram-model.ts:88](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L88)

Renderer attributes associated with the edge.

***

### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

Defined in: [core/diagram-model.ts:76](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L76)

Diagram syntax represented by the edge.

***

### id

> `readonly` **id**: `string`

Defined in: [core/diagram-model.ts:72](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L72)

Stable model identifier for the edge.

***

### kind

> `readonly` **kind**: `"edge"`

Defined in: [core/diagram-model.ts:74](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L74)

Discriminant identifying this element as an edge.

***

### label

> `readonly` **label**: `string`

Defined in: [core/diagram-model.ts:84](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L84)

Relationship label.

***

### occurrence

> `readonly` **occurrence**: `number`

Defined in: [core/diagram-model.ts:86](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L86)

Zero-based occurrence among equivalent relationships.

***

### operator

> `readonly` **operator**: `string`

Defined in: [core/diagram-model.ts:82](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L82)

Mermaid relationship operator.

***

### source

> `readonly` **source**: `string`

Defined in: [core/diagram-model.ts:78](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L78)

Source node identifier.

***

### target

> `readonly` **target**: `string`

Defined in: [core/diagram-model.ts:80](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L80)

Target node identifier.
