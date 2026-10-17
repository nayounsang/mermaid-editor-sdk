[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / EditorError

# Interface: EditorError

Defined in: [package/ui/src/runtime/types.ts:5](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L5)

Structured failure reported by the editor through `onError`.

## Properties

### cause?

> `optional` **cause?**: `unknown`

Defined in: [package/ui/src/runtime/types.ts:11](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L11)

Original error or rejection value, when available.

***

### code

> **code**: `"parse"` \| `"render"` \| `"mutation"` \| `"save"` \| `"destroyed"`

Defined in: [package/ui/src/runtime/types.ts:7](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L7)

Failure category reported by the editor.

***

### message

> **message**: `string`

Defined in: [package/ui/src/runtime/types.ts:9](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L9)

Human-readable error summary.
