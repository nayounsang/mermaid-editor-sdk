[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / EditorStatusProps

# Interface: EditorStatusProps

Defined in: [package/ui/src/ui/components/EditorStatus.tsx:7](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorStatus.tsx#L7)

Accessible status message rendered alongside the editor.

## Properties

### error?

> `readonly` `optional` **error?**: [`EditorError`](EditorError.md)

Defined in: [package/ui/src/ui/components/EditorStatus.tsx:13](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorStatus.tsx#L13)

Optional structured error details; not rendered by this component.

***

### message

> `readonly` **message**: `string`

Defined in: [package/ui/src/ui/components/EditorStatus.tsx:11](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorStatus.tsx#L11)

Accessible status message.

***

### state

> `readonly` **state**: [`EditorStatusState`](../type-aliases/EditorStatusState.md)

Defined in: [package/ui/src/ui/components/EditorStatus.tsx:9](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorStatus.tsx#L9)

Status key used for the `data-state` attribute and accessibility role.
