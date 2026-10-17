[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / DiagramAction

# Type Alias: DiagramAction

> **DiagramAction** = `z.infer`\<*typeof* `diagramActionSchema`\>

Defined in: [core/diagram-model.ts:192](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L192)

Validated editing operation accepted by a diagram session.

## Remarks

The `type` field selects one of these operations:

- Nodes: `create-node`, `create-connected-node`, `update-node`, `delete-node`.
- Edges: `create-edge`, `update-edge`, `delete-edge`.
- Subgraphs: `create-subgraph`, `update-subgraph`, `delete-subgraph`.
- Class members: `create-class-member`, `update-class-member`, `delete-class-member`.
- ER attributes: `create-er-attribute`, `update-er-attribute`, `delete-er-attribute`.
- Palette entries: `insert-palette-entry`, `insert-state-palette-entry`.
