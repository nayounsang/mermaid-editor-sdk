[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / ToolSidebarProps

# Interface: ToolSidebarProps

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:6](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L6)

## Properties

### dispatch

> `readonly` **dispatch**: (`action`) => `string` \| `undefined`

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:10](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L10)

Applies an editing action and returns the resulting source when changed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | [`DiagramAction`](../type-aliases/DiagramAction.md) |

#### Returns

`string` \| `undefined`

***

### flowchartEdgeOptions?

> `readonly` `optional` **flowchartEdgeOptions?**: `object`

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:16](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L16)

Current flowchart edge operator and label.

#### label

> `readonly` **label**: `string`

#### operator

> `readonly` **operator**: `string`

***

### model

> `readonly` **model**: [`RendererModel`](RendererModel.md)

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:8](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L8)

Current diagram model.

***

### onArmConnection

> `readonly` **onArmConnection**: (`options`) => `void`

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:14](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L14)

Starts or cancels relationship creation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`EdgeConnectionOptions`](../type-aliases/EdgeConnectionOptions.md) \| `null` |

#### Returns

`void`

***

### onFlowchartEdgeOptionsChange?

> `readonly` `optional` **onFlowchartEdgeOptionsChange?**: (`options`) => `void`

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:18](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L18)

Updates the flowchart edge operator and label.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `label`: `string`; `operator`: `string`; \} |
| `options.label` | `string` |
| `options.operator` | `string` |

#### Returns

`void`

***

### paletteComponent?

> `readonly` `optional` **paletteComponent?**: `ComponentType`\<[`DiagramPaletteProps`](DiagramPaletteProps.md)\>

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:22](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L22)

Replaces the palette inside the SDK sidebar.

#### Default

`DiagramPalette`

***

### pendingConnection?

> `readonly` `optional` **pendingConnection?**: `object`

Defined in: [package/ui/src/ui/components/ToolSidebar.tsx:12](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/ToolSidebar.tsx#L12)

Active relationship creation; `source` is set after choosing its source node.

#### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

#### source?

> `readonly` `optional` **source?**: `string`
