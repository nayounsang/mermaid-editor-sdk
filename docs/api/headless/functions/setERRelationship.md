[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / setERRelationship

# Function: setERRelationship()

> **setERRelationship**(`source`, `relationship`, `patch`): `string`

Defined in: [source/er-mutations.ts:543](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L543)

Updates one ER relationship.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `relationship` | `Pick`\<[`ERRelationship`](../interfaces/ERRelationship.md), `"source"` \| `"target"` \| `"occurrence"`\> | Relationship to update or delete. |
| `patch` | `Partial`\<`Pick`\<[`ERRelationship`](../interfaces/ERRelationship.md), `"source"` \| `"target"` \| `"cardinality"` \| `"label"` \| `"identifying"`\>\> | Properties to apply to the element. |

## Returns

`string`
