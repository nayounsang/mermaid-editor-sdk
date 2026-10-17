[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / EditorController

# Class: EditorController

Defined in: [core/editor-controller.ts:4](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L4)

## Constructors

### Constructor

> **new EditorController**(`initialSource`, `onChange?`): `EditorController`

Defined in: [core/editor-controller.ts:15](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L15)

Creates a controller for Mermaid source and an optional change callback.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initialSource` | `string` | Initial Mermaid source. |
| `onChange?` | (`value`) => `void` | Called when a non-host source change is published. |

#### Returns

`EditorController`

## Properties

### session

> `readonly` **session**: [`DiagramSession`](DiagramSession.md)

Defined in: [core/editor-controller.ts:6](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L6)

Underlying observable diagram session.

## Methods

### dispatch()

> **dispatch**(`action`): `string` \| `undefined`

Defined in: [core/editor-controller.ts:63](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L63)

Applies a diagram action and returns the new source when it changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | [`DiagramAction`](../type-aliases/DiagramAction.md) | Diagram action to validate and apply. |

#### Returns

`string` \| `undefined`

***

### redo()

> **redo**(): `string` \| `undefined`

Defined in: [core/editor-controller.ts:73](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L73)

Restores the next source in history, if one is available.

#### Returns

`string` \| `undefined`

***

### setHostValue()

> **setHostValue**(`source`): `void`

Defined in: [core/editor-controller.ts:47](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L47)

Applies a host value without publishing it as an edit.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |

#### Returns

`void`

***

### setOnChange()

> **setOnChange**(`callback?`): `void`

Defined in: [core/editor-controller.ts:24](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L24)

Replaces the callback used for published source changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback?` | (`value`) => `void` | Callback invoked when a non-host source change is published. |

#### Returns

`void`

***

### setSource()

> **setSource**(`source`, `origin?`): `boolean`

Defined in: [core/editor-controller.ts:56](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L56)

Updates source and records its origin.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to apply. |
| `origin?` | [`ChangeOrigin`](../type-aliases/ChangeOrigin.md) | `'source-editor'` | Change origin. |

#### Returns

`boolean`

***

### start()

> **start**(): `void`

Defined in: [core/editor-controller.ts:29](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L29)

Starts forwarding non-host session changes to the callback.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [core/editor-controller.ts:41](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L41)

Stops forwarding session changes.

#### Returns

`void`

***

### undo()

> **undo**(): `string` \| `undefined`

Defined in: [core/editor-controller.ts:68](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/editor-controller.ts#L68)

Restores the previous source, if one is available.

#### Returns

`string` \| `undefined`
