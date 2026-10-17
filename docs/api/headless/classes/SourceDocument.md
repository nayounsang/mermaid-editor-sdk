[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / SourceDocument

# Class: SourceDocument

Defined in: [source/source-document.ts:91](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L91)

## Constructors

### Constructor

> **new SourceDocument**(`source`, `diagramType`): `SourceDocument`

Defined in: [source/source-document.ts:103](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L103)

Analyzes source regions for safe mutations of the specified diagram type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to inspect. |
| `diagramType` | [`DiagramType`](../type-aliases/DiagramType.md) | Diagram type used to classify source regions. |

#### Returns

`SourceDocument`

## Properties

### diagramType

> `readonly` **diagramType**: [`DiagramType`](../type-aliases/DiagramType.md)

Defined in: [source/source-document.ts:95](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L95)

Diagram type used to classify source regions.

***

### regions

> `readonly` **regions**: readonly [`SourceRegion`](../interfaces/SourceRegion.md)[]

Defined in: [source/source-document.ts:97](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L97)

Source spans, including statements, comments, metadata, and opaque text.

***

### source

> `readonly` **source**: `string`

Defined in: [source/source-document.ts:93](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L93)

Original Mermaid source.

## Methods

### findUniqueEditableStatement()

> **findUniqueEditableStatement**(`statement`): [`SourceRegion`](../interfaces/SourceRegion.md)

Defined in: [source/source-document.ts:137](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L137)

Finds an editable statement and requires exactly one match.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `statement` | `string` | Exact statement text to find. |

#### Returns

[`SourceRegion`](../interfaces/SourceRegion.md)

***

### replaceStatement()

> **replaceStatement**(`start`, `end`, `replacement`): `string`

Defined in: [source/source-document.ts:116](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L116)

Replaces one safe flowchart node statement at the given source offsets.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start` | `number` | Inclusive start offset of the statement. |
| `end` | `number` | Exclusive end offset of the statement. |
| `replacement` | `string` | Replacement statement text. |

#### Returns

`string`

***

### serializeMutation()

> **serializeMutation**(`candidate`): `string`

Defined in: [source/source-document.ts:148](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L148)

Serializes a candidate mutation while preserving protected source regions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidate` | `string` | Candidate Mermaid source after a mutation. |

#### Returns

`string`
