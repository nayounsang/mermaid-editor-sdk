[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / SessionSnapshot

# Interface: SessionSnapshot

Defined in: package/headless/dist/core/diagram-model.d.ts:318

Immutable session snapshot exposed to subscribers.

## Properties

### canRedo

> `readonly` **canRedo**: `boolean`

Defined in: package/headless/dist/core/diagram-model.d.ts:328

Whether redo can restore a later source.

***

### canUndo

> `readonly` **canUndo**: `boolean`

Defined in: package/headless/dist/core/diagram-model.d.ts:326

Whether undo can restore an earlier source.

***

### codeBlock

> `readonly` **codeBlock**: `MermaidCodeBlock`

Defined in: package/headless/dist/core/diagram-model.d.ts:320

Current Mermaid source and its revision.

***

### model

> `readonly` **model**: [`RendererModel`](RendererModel.md)

Defined in: package/headless/dist/core/diagram-model.d.ts:322

Parsed diagram model.

***

### origin

> `readonly` **origin**: [`ChangeOrigin`](../type-aliases/ChangeOrigin.md)

Defined in: package/headless/dist/core/diagram-model.d.ts:324

Origin of the last source update.
