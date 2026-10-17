[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addFlowchartEdgeToSubgraph

# Function: addFlowchartEdgeToSubgraph()

> **addFlowchartEdgeToSubgraph**(`source`, `subgraphId`, `from`, `to`, `operator?`, `label?`): `string`

Defined in: [source/flowchart-mutations.ts:482](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L482)

Adds an edge inside a flowchart subgraph.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to inspect or update. |
| `subgraphId` | `string` | — | Identifier of the subgraph that receives the edge. |
| `from` | `string` | — | Source element identifier. |
| `to` | `string` | — | Target element identifier. |
| `operator?` | `string` | `'-->'` | Mermaid relationship or edge operator. |
| `label?` | `string` | `''` | Displayed label. |

## Returns

`string`
