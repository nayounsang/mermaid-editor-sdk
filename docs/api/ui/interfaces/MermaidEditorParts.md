[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / MermaidEditorParts

# Interface: MermaidEditorParts

Defined in: [package/ui/src/ui/MermaidEditor.tsx:81](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L81)

Props passed to the default UI parts and available for custom editor composition.

## Properties

### canvas

> `readonly` **canvas**: [`MermaidCanvasProps`](MermaidCanvasProps.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:89](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L89)

Props for the Mermaid canvas.

***

### diagramPalette

> `readonly` **diagramPalette**: [`DiagramPaletteProps`](DiagramPaletteProps.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:87](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L87)

Props for the diagram palette component (`DiagramPalette`).

***

### diagramTypeSelect

> `readonly` **diagramTypeSelect**: [`DiagramTypeSelectProps`](DiagramTypeSelectProps.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:97](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L97)

Props for the diagram type selector.

***

### selectionEditor

> `readonly` **selectionEditor**: [`SelectionEditorProps`](SelectionEditorProps.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:93](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L93)

Props for the selection editor.

***

### shell

> `readonly` **shell**: `Omit`\<[`EditorShellProps`](EditorShellProps.md), `"children"`\>

Defined in: [package/ui/src/ui/MermaidEditor.tsx:83](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L83)

Props for the editor shell, excluding its children.

***

### sourceEditor

> `readonly` **sourceEditor**: [`SourceEditorProps`](SourceEditorProps.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:91](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L91)

Props for the source editor.

***

### status

> `readonly` **status**: [`EditorStatusProps`](EditorStatusProps.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:95](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L95)

Props for the status display.

***

### toolbar

> `readonly` **toolbar**: [`ToolSidebarProps`](ToolSidebarProps.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:85](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L85)

Props for the sidebar component (`ToolSidebar`).
