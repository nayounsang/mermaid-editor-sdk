[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addFlowchartNode

# Function: addFlowchartNode()

> **addFlowchartNode**(`source`, `id`, `label`, `shape?`): `string`

Defined in: [source/flowchart-mutations.ts:449](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L449)

Adds a node to a flowchart.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to inspect or update. |
| `id` | `string` | — | Identifier of the diagram element. |
| `label` | `string` | — | Displayed label. |
| `shape?` | [`FlowchartNodeShape`](../type-aliases/FlowchartNodeShape.md) | `'rect'` | Node shape. |

## Returns

`string`
