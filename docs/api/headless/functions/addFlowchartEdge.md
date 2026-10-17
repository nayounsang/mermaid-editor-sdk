[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addFlowchartEdge

# Function: addFlowchartEdge()

> **addFlowchartEdge**(`source`, `from`, `to`, `operator?`, `label?`): `string`

Defined in: [source/flowchart-mutations.ts:565](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L565)

Adds an edge between flowchart nodes.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to inspect or update. |
| `from` | `string` | — | Source element identifier. |
| `to` | `string` | — | Target element identifier. |
| `operator?` | `string` | `'-->'` | Mermaid relationship or edge operator. |
| `label?` | `string` | `''` | Displayed label. |

## Returns

`string`
