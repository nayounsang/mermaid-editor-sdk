[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / setERAttribute

# Function: setERAttribute()

> **setERAttribute**(`source`, `entity`, `attribute`, `patch`): `string`

Defined in: [source/er-mutations.ts:452](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L452)

Updates one ER attribute.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `entity` | `string` | Entity identifier. |
| `attribute` | `Pick`\<[`ERAttribute`](../interfaces/ERAttribute.md), `"name"` \| `"occurrence"`\> | Attribute to add or identify. |
| `patch` | `Partial`\<`Pick`\<[`ERAttribute`](../interfaces/ERAttribute.md), `"type"` \| `"name"` \| `"key"` \| `"comment"`\>\> | Properties to apply to the element. |

## Returns

`string`
