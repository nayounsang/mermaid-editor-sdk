[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / getFlowchartEdgeStyle

# Function: getFlowchartEdgeStyle()

> **getFlowchartEdgeStyle**(`source`, `edge`, `property`): `string`

Defined in: [source/flowchart-mutations.ts:836](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L836)

Reads the style of a flowchart edge.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `edge` | [`FlowchartEdge`](../interfaces/FlowchartEdge.md) | Edge to update or delete. |
| `property` | `"stroke"` | Style property to read or update. |

## Returns

`string`
