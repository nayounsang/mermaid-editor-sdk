[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addERAttribute

# Function: addERAttribute()

> **addERAttribute**(`source`, `entity`, `attribute?`): `string`

Defined in: [source/er-mutations.ts:470](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L470)

Adds an attribute to an ER entity.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `entity` | `string` | Entity identifier. |
| `attribute?` | `Partial`\<`Pick`\<[`ERAttribute`](../interfaces/ERAttribute.md), `"type"` \| `"name"` \| `"key"` \| `"comment"`\>\> | Attribute to add or identify. |

## Returns

`string`
