[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / DiagramTypeSelectProps

# Interface: DiagramTypeSelectProps

Defined in: [package/ui/src/ui/components/DiagramTypeSelect.tsx:7](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramTypeSelect.tsx#L7)

## Properties

### model

> `readonly` **model**: [`RendererModel`](RendererModel.md)

Defined in: [package/ui/src/ui/components/DiagramTypeSelect.tsx:9](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramTypeSelect.tsx#L9)

Current diagram model and type.

***

### onChange

> `readonly` **onChange**: (`type`) => `void`

Defined in: [package/ui/src/ui/components/DiagramTypeSelect.tsx:11](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/DiagramTypeSelect.tsx#L11)

Requests a change to an editable diagram type.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `type` | `"flowchart"` \| `"sequence"` \| `"class"` \| `"state"` \| `"er"` \| `"gantt"` \| `"pie"` \| `"journey"` \| `"mindmap"` \| `"gitgraph"` \| `"timeline"` \| `"quadrant"` |

#### Returns

`void`
