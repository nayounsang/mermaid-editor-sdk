[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / DiagramSemanticElement

# Interface: DiagramSemanticElement

Defined in: package/headless/dist/core/diagram-model.d.ts:95

Diagram statement represented semantically when it has no editable graph shape.

## Properties

### attributes

> `readonly` **attributes**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: package/headless/dist/core/diagram-model.d.ts:109

Parsed attributes associated with the semantic element.

***

### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

Defined in: package/headless/dist/core/diagram-model.d.ts:101

Diagram syntax represented by the statement.

***

### id

> `readonly` **id**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:97

Stable model identifier for the semantic element.

***

### kind

> `readonly` **kind**: `"semantic"`

Defined in: package/headless/dist/core/diagram-model.d.ts:99

Discriminant identifying this element as semantic.

***

### semanticType

> `readonly` **semanticType**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:103

Semantic category assigned to the statement.

***

### sourceLine

> `readonly` **sourceLine**: `number`

Defined in: package/headless/dist/core/diagram-model.d.ts:105

One-based source line containing the statement.

***

### statement

> `readonly` **statement**: `string`

Defined in: package/headless/dist/core/diagram-model.d.ts:107

Original Mermaid statement text.
