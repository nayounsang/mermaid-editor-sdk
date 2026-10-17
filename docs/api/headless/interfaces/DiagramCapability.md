[**@mermaid-editor-sdk/headless**](../README.md)

***

[@mermaid-editor-sdk/headless](../README.md) / DiagramCapability

# Interface: DiagramCapability

Defined in: [diagrams/capability.ts:19](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/diagrams/capability.ts#L19)

Editing and preview capabilities for a detected diagram.

## Properties

### diagramType

> **diagramType**: [`DiagramType`](../type-aliases/DiagramType.md)

Defined in: [diagrams/capability.ts:21](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/diagrams/capability.ts#L21)

Detected diagram category.

***

### editor

> **editor**: `"source-only"` \| `"visual"`

Defined in: [diagrams/capability.ts:27](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/diagrams/capability.ts#L27)

Available editing mode.

***

### parse

> **parse**: `"not-checked"` \| `"valid"` \| `"invalid"`

Defined in: [diagrams/capability.ts:23](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/diagrams/capability.ts#L23)

Parse validation status.

***

### preview

> **preview**: `"pending"` \| `"available"` \| `"unavailable"`

Defined in: [diagrams/capability.ts:25](https://github.com/nayounsang/mermaid-editor-sdk/blob/main/package/headless/src/diagrams/capability.ts#L25)

Preview availability status.
