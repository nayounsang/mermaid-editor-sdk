[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / EditorController

# Class: EditorController

Defined in: package/headless/dist/core/editor-controller.d.ts:3

## Constructors

### Constructor

> **new EditorController**(`initialSource`, `onChange?`): `EditorController`

Defined in: package/headless/dist/core/editor-controller.d.ts:11

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

> `readonly` **session**: `DiagramSession`

Defined in: package/headless/dist/core/editor-controller.d.ts:6

Underlying observable diagram session.

## Methods

### dispatch()

> **dispatch**(`action`): `string` \| `undefined`

Defined in: package/headless/dist/core/editor-controller.d.ts:30

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

Defined in: package/headless/dist/core/editor-controller.d.ts:34

Restores the next source in history, if one is available.

#### Returns

`string` \| `undefined`

***

### setHostValue()

> **setHostValue**(`source`): `void`

Defined in: package/headless/dist/core/editor-controller.d.ts:21

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

Defined in: package/headless/dist/core/editor-controller.d.ts:15

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

Defined in: package/headless/dist/core/editor-controller.d.ts:26

Updates source and records its origin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `string` | Mermaid source to apply. |
| `origin?` | [`ChangeOrigin`](../type-aliases/ChangeOrigin.md) | Change origin. |

#### Returns

`boolean`

***

### start()

> **start**(): `void`

Defined in: package/headless/dist/core/editor-controller.d.ts:17

Starts forwarding non-host session changes to the callback.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: package/headless/dist/core/editor-controller.d.ts:19

Stops forwarding session changes.

#### Returns

`void`

***

### undo()

> **undo**(): `string` \| `undefined`

Defined in: package/headless/dist/core/editor-controller.d.ts:32

Restores the previous source, if one is available.

#### Returns

`string` \| `undefined`
