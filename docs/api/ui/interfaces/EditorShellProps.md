[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / EditorShellProps

# Interface: EditorShellProps

Defined in: [package/ui/src/ui/components/EditorShell.tsx:17](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L17)

## Properties

### children?

> `readonly` `optional` **children?**: `ReactNode`

Defined in: [package/ui/src/ui/components/EditorShell.tsx:29](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L29)

Compound region components to render inside the shell.

***

### className?

> `readonly` `optional` **className?**: `string`

Defined in: [package/ui/src/ui/components/EditorShell.tsx:27](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L27)

Additional class name on the root.

#### Default

`""`

***

### onKeyDown?

> `readonly` `optional` **onKeyDown?**: (`event`) => `void`

Defined in: [package/ui/src/ui/components/EditorShell.tsx:23](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L23)

Keyboard handler attached to the shell root.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `event` | `KeyboardEvent`\<`HTMLDivElement`\> |

#### Returns

`void`

***

### title?

> `readonly` `optional` **title?**: `string`

Defined in: [package/ui/src/ui/components/EditorShell.tsx:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L21)

Shell heading.

#### Default

`"Diagram"`
