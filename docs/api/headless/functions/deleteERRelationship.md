[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / deleteERRelationship

# Function: deleteERRelationship()

> **deleteERRelationship**(`source`, `relationship`): `string`

Defined in: [source/er-mutations.ts:586](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L586)

Deletes one ER relationship.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `relationship` | `Pick`\<[`ERRelationship`](../interfaces/ERRelationship.md), `"source"` \| `"target"` \| `"occurrence"`\> | Relationship to update or delete. |

## Returns

`string`
