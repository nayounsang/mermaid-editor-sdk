[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / createMermaidVisualEditor

# Function: createMermaidVisualEditor()

> **createMermaidVisualEditor**(`container`, `options`): [`MermaidVisualEditor`](../interfaces/MermaidVisualEditor.md)

Defined in: [package/ui/src/runtime/create-editor.ts:84](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/create-editor.ts#L84)

Mounts the visual editor in an existing HTML element.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `container` | `HTMLElement` | HTML element that receives the editor. |
| `options` | [`MermaidVisualEditorOptions`](../interfaces/MermaidVisualEditorOptions.md) | Initial source and optional event callbacks. |

## Returns

[`MermaidVisualEditor`](../interfaces/MermaidVisualEditor.md)

The mounted editor instance.
