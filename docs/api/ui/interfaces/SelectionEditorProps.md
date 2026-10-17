[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / SelectionEditorProps

# Interface: SelectionEditorProps

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:97](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L97)

## Properties

### dispatch

> `readonly` **dispatch**: (`action`) => `string` \| `undefined`

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:107](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L107)

Applies a selection edit and returns the new source when changed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | [`DiagramAction`](../type-aliases/DiagramAction.md) |

#### Returns

`string` \| `undefined`

***

### dispatchPreservingSelection?

> `readonly` `optional` **dispatchPreservingSelection?**: (`action`) => `string` \| `undefined`

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:111](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L111)

Optional dispatch function that preserves selection after an edit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | [`DiagramAction`](../type-aliases/DiagramAction.md) |

#### Returns

`string` \| `undefined`

#### Default

`dispatch`

***

### model

> `readonly` **model**: [`RendererModel`](RendererModel.md)

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:105](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L105)

Current diagram model used to populate editable fields.

***

### onClose

> `readonly` **onClose**: () => `void`

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:101](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L101)

Closes the dialog.

#### Returns

`void`

***

### onDelete?

> `readonly` `optional` **onDelete?**: (`selection`, `nextSource`) => `void` \| `Promise`\<`void`\>

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:113](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L113)

Called after a successful removal.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selection` | [`EditorSelection`](../type-aliases/EditorSelection.md) |
| `nextSource` | `string` |

#### Returns

`void` \| `Promise`\<`void`\>

***

### open

> `readonly` **open**: `boolean`

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:99](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L99)

Whether the selection editing dialog is open.

***

### selection

> `readonly` **selection**: [`EditorSelection`](../type-aliases/EditorSelection.md) \| `null`

Defined in: [package/ui/src/ui/components/SelectionEditor.tsx:103](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/SelectionEditor.tsx#L103)

Selected node, relationship, or subgraph; `null` when none is selected.
