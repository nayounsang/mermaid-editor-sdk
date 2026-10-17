[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / SessionSnapshot

# Interface: SessionSnapshot

Defined in: [core/diagram-model.ts:195](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L195)

Immutable session snapshot exposed to subscribers.

## Properties

### canRedo

> `readonly` **canRedo**: `boolean`

Defined in: [core/diagram-model.ts:205](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L205)

Whether redo can restore a later source.

***

### canUndo

> `readonly` **canUndo**: `boolean`

Defined in: [core/diagram-model.ts:203](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L203)

Whether undo can restore an earlier source.

***

### codeBlock

> `readonly` **codeBlock**: [`MermaidCodeBlock`](MermaidCodeBlock.md)

Defined in: [core/diagram-model.ts:197](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L197)

Current Mermaid source and its revision.

***

### model

> `readonly` **model**: [`RendererModel`](RendererModel.md)

Defined in: [core/diagram-model.ts:199](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L199)

Parsed diagram model.

***

### origin

> `readonly` **origin**: [`ChangeOrigin`](../type-aliases/ChangeOrigin.md)

Defined in: [core/diagram-model.ts:201](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-model.ts#L201)

Origin of the last source update.
