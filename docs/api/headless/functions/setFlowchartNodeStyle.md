[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / setFlowchartNodeStyle

# Function: setFlowchartNodeStyle()

> **setFlowchartNodeStyle**(`source`, `id`, `property`, `value`): `string`

Defined in: [source/flowchart-mutations.ts:741](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L741)

Sets a style property for a flowchart node.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `id` | `string` | Identifier of the diagram element. |
| `property` | `"fill"` \| `"stroke"` \| `"stroke-dasharray"` | Style property to read or update. |
| `value` | `string` | Value to assign. |

## Returns

`string`
