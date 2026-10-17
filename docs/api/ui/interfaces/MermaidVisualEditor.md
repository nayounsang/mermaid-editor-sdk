[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / MermaidVisualEditor

# Interface: MermaidVisualEditor

Defined in: [package/ui/src/runtime/types.ts:35](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L35)

Imperative controls for an editor mounted with `createMermaidVisualEditor`.

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [package/ui/src/runtime/types.ts:41](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L41)

Destroys the editor and releases its resources.

#### Returns

`void`

***

### getValue()

> **getValue**(): `string`

Defined in: [package/ui/src/runtime/types.ts:37](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L37)

Returns the current Mermaid source.

#### Returns

`string`

***

### setValue()

> **setValue**(`value`): `void`

Defined in: [package/ui/src/runtime/types.ts:39](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L39)

Replaces the current Mermaid source.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`void`
