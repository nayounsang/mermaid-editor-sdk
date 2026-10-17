[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / FlowchartNode

# Interface: FlowchartNode

Defined in: [source/flowchart-mutations.ts:7](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L7)

A parsed flowchart node and its source location.

## Properties

### declaration

> **declaration**: `boolean`

Defined in: [source/flowchart-mutations.ts:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L21)

Whether this token declares the element.

***

### id

> **id**: `string`

Defined in: [source/flowchart-mutations.ts:9](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L9)

Element or palette item identifier.

***

### label

> **label**: `string`

Defined in: [source/flowchart-mutations.ts:11](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L11)

Displayed label.

***

### lineStart

> **lineStart**: `number`

Defined in: [source/flowchart-mutations.ts:15](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L15)

Start offset of the source line.

***

### shape

> **shape**: [`FlowchartNodeShape`](../type-aliases/FlowchartNodeShape.md)

Defined in: [source/flowchart-mutations.ts:13](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L13)

Node shape.

***

### tokenEnd

> **tokenEnd**: `number`

Defined in: [source/flowchart-mutations.ts:19](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L19)

End offset of the source token.

***

### tokenStart

> **tokenStart**: `number`

Defined in: [source/flowchart-mutations.ts:17](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L17)

Start offset of the source token.
