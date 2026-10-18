# @mermaid-editor-sdk/ui

## 0.2.1

### Patch Changes

- 6c69fb2: Document the public APIs with JSDoc comments and keep the API reference alongside the source declarations.
- Updated dependencies [6c69fb2]
  - @mermaid-editor-sdk/headless@0.0.2

## 0.2.0

### Minor Changes

- db63520: Add an `onChangeDiagramType` callback and remove the built-in confirmation when changing diagram types.

### Patch Changes

- 2c79cf6: Fix zoom controls for Mermaid diagrams whose SVG width is constrained to the canvas.
- 4a4efe3: Prevent empty space in color field labels from activating the color picker.

## 0.1.3

### Patch Changes

- 928db21: Improve edge selection targets and let users create flowchart edges by dragging between nodes with the selected edge type and label.

## 0.1.2

### Patch Changes

- d05b520: Allow editor dialogs and menus to render inside a host container and expose configurable overlay layers.
- 124e9af: Remove the flowchart node hover button that was difficult to reach and appeared clipped.
- fa70a4d: Improve the selection editor with single-line labels, CSS color conversion, native color pickers, aligned actions, and a highlighted Apply button.

## 0.1.1

### Patch Changes

- 2d56544: Fix flowchart edge selection for unlabeled edges.
- 95c603c: Fix changing the relationship type in the flowchart palette.

## 0.1.0

### Minor Changes

- e2e0fb8: Add a `MermaidCanvas` ref handle for fitting, centering, and controlling zoom, plus an `autoFit` option for resize-aware previews.

## 0.0.2

### Patch Changes

- 20cd034: Polish the diagram type selector and align the state tool's state selector.

## 0.0.1

### Minor Changes

- c4e35c3: Introduce scoped SDK packages and customizable UI composition APIs.

### Patch Changes

- 47ee9c9: Improve editor canvas scrolling and zoom controls, responsive layout, and selection editing.
- 3b38a9d: Publish source export targets and clear diagram selections when adapters unmount.
- Updated dependencies [c4e35c3]
- Updated dependencies [3b38a9d]
  - @mermaid-editor-sdk/headless@0.2.0
