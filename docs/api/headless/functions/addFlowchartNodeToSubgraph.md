[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addFlowchartNodeToSubgraph

# Function: addFlowchartNodeToSubgraph()

> **addFlowchartNodeToSubgraph**(`source`, `subgraphId`, `id`, `label`, `shape?`): `string`

Defined in: [source/flowchart-mutations.ts:465](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L465)

Adds a node inside a flowchart subgraph.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to inspect or update. |
| `subgraphId` | `string` | — | Identifier of the subgraph that receives the node. |
| `id` | `string` | — | Identifier of the diagram element. |
| `label` | `string` | — | Displayed label. |
| `shape?` | [`FlowchartNodeShape`](../type-aliases/FlowchartNodeShape.md) | `'rect'` | Node shape. |

## Returns

`string`
