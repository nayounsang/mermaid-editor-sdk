[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / appendSourceLines

# Function: appendSourceLines()

> **appendSourceLines**(`source`, `additions`, `diagramType`): `string`

Defined in: [source/source-document.ts:37](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L37)

Appends diagram statements before trailing comments and whitespace.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to update. |
| `additions` | readonly `string`[] | Statements to append. |
| `diagramType` | [`DiagramType`](../type-aliases/DiagramType.md) | Diagram type used to find the insertion point. |

## Returns

`string`
