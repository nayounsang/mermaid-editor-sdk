[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / DiagramAction

# Type Alias: DiagramAction

> **DiagramAction** = `z.infer`\<*typeof* `diagramActionSchema`\>

Defined in: package/headless/dist/core/diagram-model.d.ts:316

Validated editing operation accepted by a diagram session.

## Remarks

The `type` field selects one of these operations:

- Nodes: `create-node`, `create-connected-node`, `update-node`, `delete-node`.
- Edges: `create-edge`, `update-edge`, `delete-edge`.
- Subgraphs: `create-subgraph`, `update-subgraph`, `delete-subgraph`.
- Class members: `create-class-member`, `update-class-member`, `delete-class-member`.
- ER attributes: `create-er-attribute`, `update-er-attribute`, `delete-er-attribute`.
- Palette entries: `insert-palette-entry`, `insert-state-palette-entry`.
