[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / setClassRelation

# Function: setClassRelation()

> **setClassRelation**(`source`, `relation`, `patch`): `string`

Defined in: [source/class-mutations.ts:220](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/class-mutations.ts#L220)

Updates one class relationship.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `relation` | [`ClassRelation`](../interfaces/ClassRelation.md) | Relationship to update or delete. |
| `patch` | `Partial`\<`Pick`\<[`ClassRelation`](../interfaces/ClassRelation.md), `"source"` \| `"target"` \| `"operator"`\>\> | Properties to apply to the element. |

## Returns

`string`
