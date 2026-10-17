[**@mermaid-editor-sdk/ui**](../README.md)

***

[@mermaid-editor-sdk/ui](../README.md) / MermaidCanvasHandle

# Interface: MermaidCanvasHandle

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:69](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L69)

Imperative viewport controls exposed through the canvas ref.

## Example

```tsx
import { useRef } from 'react';
import { MermaidCanvas, useMermaidEditorParts, type MermaidCanvasHandle } from '@mermaid-editor-sdk/ui';

function CanvasArea() {
  const parts = useMermaidEditorParts();
  const canvasRef = useRef<MermaidCanvasHandle>(null);
  return <>
    <button onClick={() => canvasRef.current?.fit()}>Fit</button>
    <MermaidCanvas {...parts.canvas} ref={canvasRef} />
  </>;
}
```

## Methods

### center()

> **center**(): `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:73](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L73)

Centers the diagram in the viewport without changing its zoom.

#### Returns

`void`

***

### fit()

> **fit**(): `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:71](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L71)

Scales the rendered diagram to fit the viewport, clamps zoom to 0.1–4, and resets scroll.

#### Returns

`void`

***

### setZoom()

> **setZoom**(`scale`): `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:79](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L79)

Sets zoom, clamped to the supported range of 0.1–4.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scale` | `number` |

#### Returns

`void`

***

### zoomIn()

> **zoomIn**(): `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:75](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L75)

Increases zoom by one toolbar step (0.1), up to 4.

#### Returns

`void`

***

### zoomOut()

> **zoomOut**(): `void`

Defined in: [package/ui/src/ui/components/MermaidCanvas.tsx:77](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/ui/src/ui/components/MermaidCanvas.tsx#L77)

Decreases zoom by one toolbar step (0.1), down to 0.1.

#### Returns

`void`
