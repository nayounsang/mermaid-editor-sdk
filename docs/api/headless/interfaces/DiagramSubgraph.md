[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / DiagramSubgraph

# Interface: DiagramSubgraph

Defined in: [core/diagram-model.ts:92](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L92)

Flowchart subgraph represented in the renderer model.

## Properties

### attributes

> `readonly` **attributes**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/diagram-model.ts:102](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L102)

Renderer attributes associated with the subgraph.

***

### diagramType

> `readonly` **diagramType**: `"flowchart"`

Defined in: [core/diagram-model.ts:98](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L98)

Subgraphs are currently supported for flowcharts.

***

### id

> `readonly` **id**: `string`

Defined in: [core/diagram-model.ts:94](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L94)

Stable model identifier for the subgraph.

***

### kind

> `readonly` **kind**: `"subgraph"`

Defined in: [core/diagram-model.ts:96](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L96)

Discriminant identifying this element as a subgraph.

***

### label

> `readonly` **label**: `string`

Defined in: [core/diagram-model.ts:100](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L100)

Displayed subgraph label.
