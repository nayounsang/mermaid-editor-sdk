[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / MermaidEditorProps

# Interface: MermaidEditorProps

Defined in: [package/ui/src/ui/MermaidEditor.tsx:42](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L42)

## Extends

- `Omit`\<[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md), `"value"`\>

## Properties

### autoFit?

> `readonly` `optional` **autoFit?**: `boolean`

Defined in: [package/ui/src/ui/MermaidEditor.tsx:56](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L56)

Fits the rendered diagram after rendering and when the canvas resizes.

#### Default

`false`

***

### children?

> `readonly` `optional` **children?**: `ReactNode`

Defined in: [package/ui/src/ui/MermaidEditor.tsx:77](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L77)

Custom composition; when provided, replaces the default UI composition.

#### Default

```ts
the SDK's standard editor layout
```

***

### className?

> `readonly` `optional` **className?**: `string`

Defined in: [package/ui/src/ui/MermaidEditor.tsx:48](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L48)

Class added to the default shell root.

#### Default

`""`

***

### onChange?

> `optional` **onChange?**: (`value`) => `void`

Defined in: [package/ui/src/runtime/types.ts:19](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L19)

Called when the user edits the source; programmatic source updates do not invoke it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` |

#### Returns

`void`

#### Inherited from

[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md).[`onChange`](MermaidVisualEditorOptions.md#onchange)

***

### onChangeDiagramType?

> `optional` **onChangeDiagramType?**: (`diagramType`) => `void`

Defined in: [package/ui/src/runtime/types.ts:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L21)

Called after a new diagram type is selected and its default source is applied.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `diagramType` | [`EditableDiagramType`](../type-aliases/EditableDiagramType.md) |

#### Returns

`void`

#### Inherited from

[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md).[`onChangeDiagramType`](MermaidVisualEditorOptions.md#onchangediagramtype)

***

### onError?

> `optional` **onError?**: (`error`) => `void`

Defined in: [package/ui/src/runtime/types.ts:25](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L25)

Receives parse, render, mutation, save, or lifecycle errors.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | [`EditorError`](EditorError.md) |

#### Returns

`void`

#### Inherited from

[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md).[`onError`](MermaidVisualEditorOptions.md#onerror)

***

### onRemove?

> `optional` **onRemove?**: (`selection`, `nextSource`) => `void` \| `Promise`\<`void`\>

Defined in: [package/ui/src/runtime/types.ts:31](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L31)

Called after removal with the selection and resulting source.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selection` | [`EditorSelection`](../type-aliases/EditorSelection.md) |
| `nextSource` | `string` |

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md).[`onRemove`](MermaidVisualEditorOptions.md#onremove)

***

### onReset?

> `optional` **onReset?**: (`nextSource`) => `void` \| `Promise`\<`void`\>

Defined in: [package/ui/src/runtime/types.ts:29](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L29)

Called after Reset with the resulting source.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `nextSource` | `string` |

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md).[`onReset`](MermaidVisualEditorOptions.md#onreset)

***

### onSave?

> `optional` **onSave?**: (`currentSource`) => `void` \| `Promise`\<`void`\>

Defined in: [package/ui/src/runtime/types.ts:27](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L27)

Called by Save with the current source.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `currentSource` | `string` |

#### Returns

`void` \| `Promise`\<`void`\>

#### Inherited from

[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md).[`onSave`](MermaidVisualEditorOptions.md#onsave)

***

### onSelectionChange?

> `optional` **onSelectionChange?**: (`selection`) => `void`

Defined in: [package/ui/src/runtime/types.ts:23](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/runtime/types.ts#L23)

Called when the selection changes or clears.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `selection` | [`EditorSelection`](../type-aliases/EditorSelection.md) \| `null` |

#### Returns

`void`

#### Inherited from

[`MermaidVisualEditorOptions`](MermaidVisualEditorOptions.md).[`onSelectionChange`](MermaidVisualEditorOptions.md#onselectionchange)

***

### portalContainer?

> `readonly` `optional` **portalContainer?**: [`PortalContainer`](../type-aliases/PortalContainer.md)

Defined in: [package/ui/src/ui/MermaidEditor.tsx:73](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L73)

Parent container for editor dialogs and popovers. When used inside a host modal, provide an element within that modal. The target must be in the regular DOM and in the document that loads the SDK stylesheet; Shadow DOM targets are unsupported.

#### Default

`document.body`

#### Example

```tsx
import { useRef } from 'react';
import { MermaidEditor } from '@mermaid-editor-sdk/ui';
import '@mermaid-editor-sdk/ui/style.css';

function DiagramDialogContent({ source, setSource }: { source: string; setSource: (value: string) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  return <div ref={dialogRef} className="host-dialog-overlay">
    <MermaidEditor value={source} onChange={setSource} portalContainer={dialogRef} />
  </div>;
}
```

***

### title?

> `readonly` `optional` **title?**: `string`

Defined in: [package/ui/src/ui/MermaidEditor.tsx:52](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L52)

Default shell heading.

#### Default

`"Diagram"`

***

### value

> `readonly` **value**: `string`

Defined in: [package/ui/src/ui/MermaidEditor.tsx:44](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/MermaidEditor.tsx#L44)

Mermaid source controlled by the host.
