[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / deleteERAttribute

# Function: deleteERAttribute()

> **deleteERAttribute**(`source`, `entity`, `attribute`): `string`

Defined in: [source/er-mutations.ts:502](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L502)

Deletes one attribute from an ER entity.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect or update. |
| `entity` | `string` | Entity identifier. |
| `attribute` | `Pick`\<[`ERAttribute`](../interfaces/ERAttribute.md), `"name"` \| `"occurrence"`\> | Attribute to add or identify. |

## Returns

`string`
