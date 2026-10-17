[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / StateTransition

# Interface: StateTransition

Defined in: [source/state-mutations.ts:4](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L4)

A parsed state transition and offsets for its editable source tokens.

## Properties

### end

> **end**: `number`

Defined in: [source/state-mutations.ts:16](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L16)

End offset in the source.

***

### label

> **label**: `string`

Defined in: [source/state-mutations.ts:10](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L10)

Displayed label.

***

### labelEnd?

> `optional` **labelEnd?**: `number`

Defined in: [source/state-mutations.ts:30](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L30)

End offset of the label, when present.

***

### labelSeparatorStart?

> `optional` **labelSeparatorStart?**: `number`

Defined in: [source/state-mutations.ts:26](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L26)

Start offset of the label separator, when present.

***

### labelStart?

> `optional` **labelStart?**: `number`

Defined in: [source/state-mutations.ts:28](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L28)

Start offset of the label, when present.

***

### occurrence

> **occurrence**: `number`

Defined in: [source/state-mutations.ts:12](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L12)

Zero-based occurrence among matching elements.

***

### source

> **source**: `string`

Defined in: [source/state-mutations.ts:6](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L6)

Source element or entity identifier.

***

### sourceEnd

> **sourceEnd**: `number`

Defined in: [source/state-mutations.ts:20](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L20)

End offset of the source token.

***

### sourceStart

> **sourceStart**: `number`

Defined in: [source/state-mutations.ts:18](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L18)

Start offset of the source token.

***

### start

> **start**: `number`

Defined in: [source/state-mutations.ts:14](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L14)

Start offset in the source.

***

### target

> **target**: `string`

Defined in: [source/state-mutations.ts:8](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L8)

Target element or entity identifier.

***

### targetEnd

> **targetEnd**: `number`

Defined in: [source/state-mutations.ts:24](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L24)

End offset of the target token.

***

### targetStart

> **targetStart**: `number`

Defined in: [source/state-mutations.ts:22](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/state-mutations.ts#L22)

Start offset of the target token.
