[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / DiagramSession

# Class: DiagramSession

Defined in: [core/diagram-session.ts:418](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L418)

## Constructors

### Constructor

> **new DiagramSession**(`initialSource`): `DiagramSession`

Defined in: [core/diagram-session.ts:432](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L432)

Creates a session initialized with Mermaid source.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initialSource` | `string` | Initial Mermaid source. |

#### Returns

`DiagramSession`

## Properties

### store

> `readonly` **store**: `StoreApi`\<[`SessionSnapshot`](../interfaces/SessionSnapshot.md)\>

Defined in: [core/diagram-session.ts:427](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L427)

Vanilla Zustand store containing the current session snapshot.

## Methods

### dispatch()

> **dispatch**(`action`): `string` \| `undefined`

Defined in: [core/diagram-session.ts:483](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L483)

Applies a diagram action and returns the new source when it changes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | [`DiagramAction`](../type-aliases/DiagramAction.md) | Action to validate and apply to the current diagram. |

#### Returns

`string` \| `undefined`

***

### getServerSnapshot()

> **getServerSnapshot**(): [`SessionSnapshot`](../interfaces/SessionSnapshot.md)

Defined in: [core/diagram-session.ts:452](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L452)

Returns the initial snapshot for server rendering.

#### Returns

[`SessionSnapshot`](../interfaces/SessionSnapshot.md)

***

### getSnapshot()

> **getSnapshot**(): [`SessionSnapshot`](../interfaces/SessionSnapshot.md)

Defined in: [core/diagram-session.ts:450](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L450)

Returns the current session snapshot.

#### Returns

[`SessionSnapshot`](../interfaces/SessionSnapshot.md)

***

### redo()

> **redo**(): `string` \| `undefined`

Defined in: [core/diagram-session.ts:521](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L521)

Restores the next source in history, if one is available.

#### Returns

`string` \| `undefined`

***

### setParseResult()

> **setParseResult**(`sourceRevision`, `valid`): `void`

Defined in: [core/diagram-session.ts:503](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L503)

Updates parse state only when the revision still matches the current source.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sourceRevision` | `number` | Revision that was parsed. |
| `valid` | `boolean` | Whether parsing succeeded. |

#### Returns

`void`

***

### setSource()

> **setSource**(`source`, `origin?`): `boolean`

Defined in: [core/diagram-session.ts:460](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L460)

Replaces source and updates undo history according to the change origin.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `source` | `string` | — | Mermaid source to apply. |
| `origin?` | [`ChangeOrigin`](../type-aliases/ChangeOrigin.md) | `'host'` | Change origin. |

#### Returns

`boolean`

***

### subscribe()

> **subscribe**(`listener`): () => `void`

Defined in: [core/diagram-session.ts:454](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L454)

Subscribes to snapshot changes and returns an unsubscribe function.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `listener` | () => `void` |

#### Returns

() => `void`

***

### undo()

> **undo**(): `string` \| `undefined`

Defined in: [core/diagram-session.ts:513](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/core/diagram-session.ts#L513)

Restores the previous source, if one is available.

#### Returns

`string` \| `undefined`
