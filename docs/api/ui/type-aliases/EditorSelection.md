[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / EditorSelection

# Type Alias: EditorSelection

> **EditorSelection** = \{ `diagramType`: [`DiagramType`](DiagramType.md); `id`: `string`; `kind`: `"node"`; \} \| \{ `diagramType`: [`DiagramType`](DiagramType.md); `kind`: `"edge"`; `occurrence?`: `number`; `source`: `string`; `target`: `string`; \} \| \{ `diagramType`: `"flowchart"`; `id`: `string`; `kind`: `"subgraph"`; `title?`: `string`; \}

Defined in: package/headless/dist/core/diagram-model.d.ts:6

Selection reported by an interactive diagram canvas.

## Union Members

### Type Literal

\{ `diagramType`: [`DiagramType`](DiagramType.md); `id`: `string`; `kind`: `"node"`; \}

#### diagramType

> **diagramType**: [`DiagramType`](DiagramType.md)

Diagram containing the node.

#### id

> **id**: `string`

Selected node identifier.

#### kind

> **kind**: `"node"`

Selection discriminant for a node.

***

### Type Literal

\{ `diagramType`: [`DiagramType`](DiagramType.md); `kind`: `"edge"`; `occurrence?`: `number`; `source`: `string`; `target`: `string`; \}

#### diagramType

> **diagramType**: [`DiagramType`](DiagramType.md)

Diagram containing the edge.

#### kind

> **kind**: `"edge"`

Selection discriminant for an edge.

#### occurrence?

> `optional` **occurrence?**: `number`

Zero-based occurrence among edges with the same endpoints.

#### source

> **source**: `string`

Source node identifier.

#### target

> **target**: `string`

Target node identifier.

***

### Type Literal

\{ `diagramType`: `"flowchart"`; `id`: `string`; `kind`: `"subgraph"`; `title?`: `string`; \}

#### diagramType

> **diagramType**: `"flowchart"`

This selection variant is only used for flowcharts.

#### id

> **id**: `string`

Selected subgraph identifier.

#### kind

> **kind**: `"subgraph"`

Selection discriminant for a flowchart subgraph.

#### title?

> `optional` **title?**: `string`

Selected subgraph title, when available.
