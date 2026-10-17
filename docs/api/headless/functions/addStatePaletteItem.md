[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / addStatePaletteItem

# Function: addStatePaletteItem()

> **addStatePaletteItem**(`source`, `item`, `stateId?`, `label?`): `string`

Defined in: [source/state-mutations.ts:395](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L395)

Adds a state palette item to the source.

## Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to inspect or update. |
| `item` | [`StatePaletteItemId`](../type-aliases/StatePaletteItemId.md) | — | Identifier of the palette item to add. |
| `stateId?` | `string` | `undefined` | Optional state identifier used by the palette item. |
| `label?` | `string` | `''` | Displayed label. |

## Returns

`string`
