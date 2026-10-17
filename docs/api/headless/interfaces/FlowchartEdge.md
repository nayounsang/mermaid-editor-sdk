[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / FlowchartEdge

# Interface: FlowchartEdge

Defined in: [source/flowchart-mutations.ts:25](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L25)

A parsed flowchart edge and offsets for its editable source syntax.

## Properties

### inlineLabel?

> `optional` **inlineLabel?**: `boolean`

Defined in: [source/flowchart-mutations.ts:47](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L47)

Whether the label uses inline edge syntax.

***

### label

> **label**: `string`

Defined in: [source/flowchart-mutations.ts:33](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L33)

Displayed label.

***

### labelEnd?

> `optional` **labelEnd?**: `number`

Defined in: [source/flowchart-mutations.ts:45](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L45)

End offset of the label, when present.

***

### labelStart?

> `optional` **labelStart?**: `number`

Defined in: [source/flowchart-mutations.ts:43](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L43)

Start offset of the label, when present.

***

### lineStart

> **lineStart**: `number`

Defined in: [source/flowchart-mutations.ts:35](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L35)

Start offset of the source line.

***

### occurrence

> **occurrence**: `number`

Defined in: [source/flowchart-mutations.ts:49](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L49)

Zero-based occurrence among matching elements.

***

### operator

> **operator**: `string`

Defined in: [source/flowchart-mutations.ts:31](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L31)

Mermaid relationship or edge operator.

***

### operatorEnd

> **operatorEnd**: `number`

Defined in: [source/flowchart-mutations.ts:39](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L39)

End offset of the operator token.

***

### operatorStart

> **operatorStart**: `number`

Defined in: [source/flowchart-mutations.ts:37](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L37)

Start offset of the operator token.

***

### source

> **source**: `string`

Defined in: [source/flowchart-mutations.ts:27](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L27)

Source element or entity identifier.

***

### syntaxEnd

> **syntaxEnd**: `number`

Defined in: [source/flowchart-mutations.ts:41](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L41)

End offset of the edge syntax.

***

### target

> **target**: `string`

Defined in: [source/flowchart-mutations.ts:29](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/flowchart-mutations.ts#L29)

Target element or entity identifier.
