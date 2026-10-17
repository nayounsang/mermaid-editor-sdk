[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / SourceRegion

# Interface: SourceRegion

Defined in: [source/source-document.ts:7](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L7)

A source span classified for safe diagram mutations.

## Properties

### editable

> **editable**: `boolean`

Defined in: [source/source-document.ts:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L21)

Whether the region can be safely edited.

***

### end

> **end**: `number`

Defined in: [source/source-document.ts:13](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L13)

End offset of the editable text, exclusive.

***

### fullEnd

> **fullEnd**: `number`

Defined in: [source/source-document.ts:15](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L15)

End offset including the original line ending, when present.

***

### kind

> **kind**: [`SourceRegionKind`](../type-aliases/SourceRegionKind.md)

Defined in: [source/source-document.ts:9](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L9)

Content category for this span.

***

### rawText

> **rawText**: `string`

Defined in: [source/source-document.ts:19](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L19)

Original source text for the full region.

***

### start

> **start**: `number`

Defined in: [source/source-document.ts:11](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L11)

Start offset of the editable text, inclusive.

***

### text

> **text**: `string`

Defined in: [source/source-document.ts:17](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/source-document.ts#L17)

Normalized text content.
