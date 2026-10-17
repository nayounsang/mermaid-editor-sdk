[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / deleteStateTransition

# Function: deleteStateTransition()

> **deleteStateTransition**(`source`, `transition`): `string`

Defined in: [source/state-mutations.ts:516](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L516)

Deletes one state transition.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `transition` | `Pick`\<[`StateTransition`](../interfaces/StateTransition.md), `"source"` \| `"target"` \| `"occurrence"`\> | Transition identified by source, target, and occurrence. |

## Returns

`string`
