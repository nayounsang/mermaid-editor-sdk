[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / setStateTransition

# Function: setStateTransition()

> **setStateTransition**(`source`, `transition`, `patch`): `string`

Defined in: [source/state-mutations.ts:472](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L472)

Updates one state transition.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `transition` | `Pick`\<[`StateTransition`](../interfaces/StateTransition.md), `"source"` \| `"target"` \| `"occurrence"`\> | Transition identified by source, target, and occurrence. |
| `patch` | `Partial`\<`Pick`\<[`StateTransition`](../interfaces/StateTransition.md), `"source"` \| `"target"` \| `"label"`\>\> | Properties to apply to the element. |

## Returns

`string`
