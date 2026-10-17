[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / SourceDocument

# Class: SourceDocument

Defined in: package/headless/dist/source/source-document.d.ts:30

## Constructors

### Constructor

> **new SourceDocument**(`source`, `diagramType`): `SourceDocument`

Defined in: package/headless/dist/source/source-document.d.ts:41

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

Defined in: package/headless/dist/source/source-document.d.ts:34

Diagram type used to classify source regions.

***

### regions

> `readonly` **regions**: readonly `SourceRegion`[]

Defined in: package/headless/dist/source/source-document.d.ts:36

Source spans, including statements, comments, metadata, and opaque text.

***

### source

> `readonly` **source**: `string`

Defined in: package/headless/dist/source/source-document.d.ts:32

Original Mermaid source.

## Methods

### findUniqueEditableStatement()

> **findUniqueEditableStatement**(`statement`): `SourceRegion`

Defined in: package/headless/dist/source/source-document.d.ts:51

Finds an editable statement and requires exactly one match.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `statement` | `string` | Exact statement text to find. |

#### Returns

`SourceRegion`

***

### replaceStatement()

> **replaceStatement**(`start`, `end`, `replacement`): `string`

Defined in: package/headless/dist/source/source-document.d.ts:47

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

Defined in: package/headless/dist/source/source-document.d.ts:55

Serializes a candidate mutation while preserving protected source regions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidate` | `string` | Candidate Mermaid source after a mutation. |

#### Returns

`string`
