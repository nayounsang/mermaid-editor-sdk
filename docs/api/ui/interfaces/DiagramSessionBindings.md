[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / DiagramSessionBindings

# Interface: DiagramSessionBindings

Defined in: [package/ui/src/ui/hooks/useDiagramSession.ts:7](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/hooks/useDiagramSession.ts#L7)

Observable session values and editing actions returned by `useDiagramSession`.

## Properties

### dispatch

> `readonly` **dispatch**: (`action`) => `string` \| `undefined`

Defined in: [package/ui/src/ui/hooks/useDiagramSession.ts:11](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/hooks/useDiagramSession.ts#L11)

Applies a diagram action and returns the resulting source when changed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | [`DiagramAction`](../type-aliases/DiagramAction.md) |

#### Returns

`string` \| `undefined`

***

### redo

> `readonly` **redo**: () => `string` \| `undefined`

Defined in: [package/ui/src/ui/hooks/useDiagramSession.ts:15](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/hooks/useDiagramSession.ts#L15)

Reapplies the next source change.

#### Returns

`string` \| `undefined`

***

### setSource

> `readonly` **setSource**: (`source`, `origin?`) => `boolean`

Defined in: [package/ui/src/ui/hooks/useDiagramSession.ts:17](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/hooks/useDiagramSession.ts#L17)

Replaces source and optionally records its change origin. Defaults to `'source-editor'`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |
| `origin?` | [`ChangeOrigin`](../type-aliases/ChangeOrigin.md) |

#### Returns

`boolean`

***

### snapshot

> `readonly` **snapshot**: [`SessionSnapshot`](SessionSnapshot.md)

Defined in: [package/ui/src/ui/hooks/useDiagramSession.ts:9](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/hooks/useDiagramSession.ts#L9)

Current session state.

***

### undo

> `readonly` **undo**: () => `string` \| `undefined`

Defined in: [package/ui/src/ui/hooks/useDiagramSession.ts:13](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/hooks/useDiagramSession.ts#L13)

Reverts the last source change.

#### Returns

`string` \| `undefined`
