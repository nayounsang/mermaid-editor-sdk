[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / DiagramSemanticElement

# Interface: DiagramSemanticElement

Defined in: [core/diagram-model.ts:106](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L106)

Diagram statement represented semantically when it has no editable graph shape.

## Properties

### attributes

> `readonly` **attributes**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [core/diagram-model.ts:120](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L120)

Parsed attributes associated with the semantic element.

***

### diagramType

> `readonly` **diagramType**: [`EditableDiagramType`](../type-aliases/EditableDiagramType.md)

Defined in: [core/diagram-model.ts:112](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L112)

Diagram syntax represented by the statement.

***

### id

> `readonly` **id**: `string`

Defined in: [core/diagram-model.ts:108](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L108)

Stable model identifier for the semantic element.

***

### kind

> `readonly` **kind**: `"semantic"`

Defined in: [core/diagram-model.ts:110](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L110)

Discriminant identifying this element as semantic.

***

### semanticType

> `readonly` **semanticType**: `string`

Defined in: [core/diagram-model.ts:114](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L114)

Semantic category assigned to the statement.

***

### sourceLine

> `readonly` **sourceLine**: `number`

Defined in: [core/diagram-model.ts:116](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L116)

One-based source line containing the statement.

***

### statement

> `readonly` **statement**: `string`

Defined in: [core/diagram-model.ts:118](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L118)

Original Mermaid statement text.
