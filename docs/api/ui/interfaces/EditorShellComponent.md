[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / EditorShellComponent

# Interface: EditorShellComponent()

Defined in: [package/ui/src/ui/components/EditorShell.tsx:33](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L33)

`EditorShell` component with named compound regions for composing the editor layout.

## Extends

- `FunctionComponent`\<[`EditorShellProps`](EditorShellProps.md)\>

> **EditorShellComponent**(`props`): `ReactNode` \| `Promise`\<`ReactNode`\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:33](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L33)

`EditorShell` component with named compound regions for composing the editor layout.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`EditorShellProps`](EditorShellProps.md) |

## Returns

`ReactNode` \| `Promise`\<`ReactNode`\>

## Properties

### Actions

> `readonly` **Actions**: `FunctionComponent`\<[`EditorShellRegionProps`](EditorShellRegionProps.md)\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:47](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L47)

Region for header actions.

***

### Canvas

> `readonly` **Canvas**: `FunctionComponent`\<[`EditorShellRegionProps`](EditorShellRegionProps.md)\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:37](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L37)

Region for the diagram canvas.

***

### HeaderControls

> `readonly` **HeaderControls**: `FunctionComponent`\<[`EditorShellRegionProps`](EditorShellRegionProps.md)\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:45](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L45)

Region for diagram type and other header controls.

***

### Selection

> `readonly` **Selection**: `FunctionComponent`\<[`EditorShellRegionProps`](EditorShellRegionProps.md)\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:41](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L41)

Region for the selection editor.

***

### Sidebar

> `readonly` **Sidebar**: `FunctionComponent`\<[`EditorShellRegionProps`](EditorShellRegionProps.md)\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:35](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L35)

Region for sidebar content.

***

### Source

> `readonly` **Source**: `FunctionComponent`\<[`EditorShellRegionProps`](EditorShellRegionProps.md)\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:39](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L39)

Region for the Mermaid source editor.

***

### Status

> `readonly` **Status**: `FunctionComponent`\<[`EditorShellRegionProps`](EditorShellRegionProps.md)\>

Defined in: [package/ui/src/ui/components/EditorShell.tsx:43](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/EditorShell.tsx#L43)

Region for the status message.
