[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / getFlowchartElementStyle

# Function: getFlowchartElementStyle()

> **getFlowchartElementStyle**(`source`, `id`, `property`): `string`

Defined in: [source/flowchart-mutations.ts:775](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L775)

Reads a style property for a flowchart element.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `id` | `string` | Identifier of the diagram element. |
| `property` | `"fill"` \| `"stroke"` \| `"stroke-dasharray"` | Style property to read or update. |

## Returns

`string`
