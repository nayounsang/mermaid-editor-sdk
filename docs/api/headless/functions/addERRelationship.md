[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addERRelationship

# Function: addERRelationship()

> **addERRelationship**(`source`, `from`, `to`, `cardinality?`, `label?`, `identifying?`): `string`

Defined in: [source/er-mutations.ts:526](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L526)

Adds a relationship between two ER entities.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to inspect or update. |
| `from` | `string` | — | Source element identifier. |
| `to` | `string` | — | Target element identifier. |
| `cardinality?` | [`ERCardinality`](../type-aliases/ERCardinality.md) | `'one-many'` | Relationship cardinality. |
| `label?` | `string` | `'relates'` | Displayed label. |
| `identifying?` | `boolean` | `true` | Whether the relationship is identifying. |

## Returns

`string`
