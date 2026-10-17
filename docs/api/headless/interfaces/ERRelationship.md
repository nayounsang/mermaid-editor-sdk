[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / ERRelationship

# Interface: ERRelationship

Defined in: [source/er-mutations.ts:9](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L9)

A parsed ER relationship and offsets for its editable source tokens.

## Properties

### cardinality

> **cardinality**: [`ERCardinality`](../type-aliases/ERCardinality.md)

Defined in: [source/er-mutations.ts:15](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L15)

Relationship cardinality.

***

### end

> **end**: `number`

Defined in: [source/er-mutations.ts:25](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L25)

End offset in the source.

***

### identifying

> **identifying**: `boolean`

Defined in: [source/er-mutations.ts:17](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L17)

Whether this is an identifying relationship.

***

### label

> **label**: `string`

Defined in: [source/er-mutations.ts:19](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L19)

Displayed label.

***

### labelEnd?

> `optional` **labelEnd?**: `number`

Defined in: [source/er-mutations.ts:41](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L41)

End offset of the label, when present.

***

### labelSeparatorStart?

> `optional` **labelSeparatorStart?**: `number`

Defined in: [source/er-mutations.ts:43](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L43)

Start offset of the label separator, when present.

***

### labelStart?

> `optional` **labelStart?**: `number`

Defined in: [source/er-mutations.ts:39](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L39)

Start offset of the label, when present.

***

### occurrence

> **occurrence**: `number`

Defined in: [source/er-mutations.ts:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L21)

Zero-based occurrence among matching elements.

***

### operatorEnd

> **operatorEnd**: `number`

Defined in: [source/er-mutations.ts:33](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L33)

End offset of the operator token.

***

### operatorStart

> **operatorStart**: `number`

Defined in: [source/er-mutations.ts:31](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L31)

Start offset of the operator token.

***

### source

> **source**: `string`

Defined in: [source/er-mutations.ts:11](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L11)

Source element or entity identifier.

***

### sourceEnd

> **sourceEnd**: `number`

Defined in: [source/er-mutations.ts:29](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L29)

End offset of the source token.

***

### sourceStart

> **sourceStart**: `number`

Defined in: [source/er-mutations.ts:27](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L27)

Start offset of the source token.

***

### start

> **start**: `number`

Defined in: [source/er-mutations.ts:23](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L23)

Start offset in the source.

***

### target

> **target**: `string`

Defined in: [source/er-mutations.ts:13](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L13)

Target element or entity identifier.

***

### targetEnd

> **targetEnd**: `number`

Defined in: [source/er-mutations.ts:37](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L37)

End offset of the target token.

***

### targetStart

> **targetStart**: `number`

Defined in: [source/er-mutations.ts:35](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/source/er-mutations.ts#L35)

Start offset of the target token.
