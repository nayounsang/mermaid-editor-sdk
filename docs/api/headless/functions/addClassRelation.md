[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addClassRelation

# Function: addClassRelation()

> **addClassRelation**(`source`, `from`, `to`, `operator?`): `string`

Defined in: [source/class-mutations.ts:199](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/class-mutations.ts#L199)

Adds a relationship between two classes.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to inspect or update. |
| `from` | `string` | — | Source element identifier. |
| `to` | `string` | — | Target element identifier. |
| `operator?` | [`ClassRelationOperator`](../type-aliases/ClassRelationOperator.md) | `'-->'` | Mermaid relationship or edge operator. |

## Returns

`string`
