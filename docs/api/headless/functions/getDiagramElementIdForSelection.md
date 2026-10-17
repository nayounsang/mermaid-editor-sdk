[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / getDiagramElementIdForSelection

# Function: getDiagramElementIdForSelection()

> **getDiagramElementIdForSelection**(`elements`, `selection`): `string` \| `undefined`

Defined in: [core/selection-mapping.ts:8](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/selection-mapping.ts#L8)

Finds the model element identifier corresponding to a canvas selection.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `elements` | readonly [`DiagramElement`](../type-aliases/DiagramElement.md)[] | Diagram elements to search. |
| `selection` | [`EditorSelection`](../type-aliases/EditorSelection.md) | Selected node, edge, or flowchart subgraph. |

## Returns

`string` \| `undefined`

The matching model element ID, if found.
