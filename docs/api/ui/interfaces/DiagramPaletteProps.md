[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / DiagramPaletteProps

# Interface: DiagramPaletteProps

Defined in: [package/ui/src/ui/components/DiagramPalette.tsx:13](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramPalette.tsx#L13)

## Properties

### dispatch

> `readonly` **dispatch**: (`action`) => `string` \| `undefined`

Defined in: [package/ui/src/ui/components/DiagramPalette.tsx:17](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramPalette.tsx#L17)

Applies a palette action and returns the new source when changed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | [`DiagramAction`](../type-aliases/DiagramAction.md) |

#### Returns

`string` \| `undefined`

***

### flowchartEdgeOptions?

> `readonly` `optional` **flowchartEdgeOptions?**: `object`

Defined in: [package/ui/src/ui/components/DiagramPalette.tsx:23](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramPalette.tsx#L23)

Current flowchart edge operator and label.

#### label

> `readonly` **label**: `string`

#### operator

> `readonly` **operator**: `string`

***

### model

> `readonly` **model**: [`RendererModel`](RendererModel.md)

Defined in: [package/ui/src/ui/components/DiagramPalette.tsx:15](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramPalette.tsx#L15)

Current diagram model.

***

### onArmConnection

> `readonly` **onArmConnection**: (`options`) => `void`

Defined in: [package/ui/src/ui/components/DiagramPalette.tsx:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramPalette.tsx#L21)

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

Defined in: [package/ui/src/ui/components/DiagramPalette.tsx:25](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramPalette.tsx#L25)

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

### pendingConnection?

> `readonly` `optional` **pendingConnection?**: `object`

Defined in: [package/ui/src/ui/components/DiagramPalette.tsx:19](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramPalette.tsx#L19)

Active relationship creation; `source` is set after choosing its source node.

#### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

#### source?

> `readonly` `optional` **source?**: `string`
