[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / MermaidVisualEditorOptions

# Interface: MermaidVisualEditorOptions

Defined in: [package/ui/src/runtime/types.ts:15](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L15)

Initial value and event callbacks for the imperative visual editor.

## Properties

### onChange?

> `optional` **onChange?**: (`value`) => `void`

Defined in: [package/ui/src/runtime/types.ts:19](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L19)

Called when the user edits the source; programmatic source updates do not invoke it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`void`

***

### onChangeDiagramType?

> `optional` **onChangeDiagramType?**: (`diagramType`) => `void`

Defined in: [package/ui/src/runtime/types.ts:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L21)

Called after a new diagram type is selected and its default source is applied.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `diagramType` | [`EditableDiagramType`](../type-aliases/EditableDiagramType.md) |

#### Returns

`void`

***

### onError?

> `optional` **onError?**: (`error`) => `void`

Defined in: [package/ui/src/runtime/types.ts:25](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L25)

Receives parse, render, mutation, save, or lifecycle errors.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | [`EditorError`](EditorError.md) |

#### Returns

`void`

***

### onRemove?

> `optional` **onRemove?**: (`selection`, `nextSource`) => `void` \| `Promise`\<`void`\>

Defined in: [package/ui/src/runtime/types.ts:31](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L31)

Called after removal with the selection and resulting source.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selection` | [`EditorSelection`](../type-aliases/EditorSelection.md) |
| `nextSource` | `string` |

#### Returns

`void` \| `Promise`\<`void`\>

***

### onReset?

> `optional` **onReset?**: (`nextSource`) => `void` \| `Promise`\<`void`\>

Defined in: [package/ui/src/runtime/types.ts:29](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L29)

Called after Reset with the resulting source.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nextSource` | `string` |

#### Returns

`void` \| `Promise`\<`void`\>

***

### onSave?

> `optional` **onSave?**: (`currentSource`) => `void` \| `Promise`\<`void`\>

Defined in: [package/ui/src/runtime/types.ts:27](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L27)

Called by Save with the current source.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `currentSource` | `string` |

#### Returns

`void` \| `Promise`\<`void`\>

***

### onSelectionChange?

> `optional` **onSelectionChange?**: (`selection`) => `void`

Defined in: [package/ui/src/runtime/types.ts:23](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L23)

Called when the selection changes or clears.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selection` | [`EditorSelection`](../type-aliases/EditorSelection.md) \| `null` |

#### Returns

`void`

***

### value

> **value**: `string`

Defined in: [package/ui/src/runtime/types.ts:17](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L17)

Initial Mermaid source.
