# Development

## Setup

Use Node.js 24 LTS from `.nvmrc` and the package manager version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
```

## Workspace

| Path | Package | Responsibility |
|---|---|---|
| `package/headless` | `@mermaid-editor-sdk/headless` | Diagram sessions, models, source parsing, and source mutations. |
| `package/ui` | `@mermaid-editor-sdk/ui` | React components, rendering, and editor integration. |
| `app/example` | `@mermaid-editor/example` | Browser example app used during development. |

The example app resolves workspace packages through their `source` export condition, so edits to package source appear without rebuilding first.

## Run the example app

```sh
pnpm dev
```

Vite prints the local URL when the server starts. The app is served on `127.0.0.1`.

## Common commands

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

Run a command for one package with a workspace filter:

```sh
pnpm --filter @mermaid-editor-sdk/headless test
pnpm --filter @mermaid-editor-sdk/ui test
pnpm --filter @mermaid-editor-sdk/ui typecheck
```

Turbo builds package dependencies before `typecheck` and `test`. The build graph builds headless before UI, then the example app.

## Changesets

Add a changeset when a feature or fix changes a published package. Documentation-only and internal changes do not need one.

```sh
pnpm changeset
```

Select each affected package, choose a version bump, and enter a short user-facing summary. Use `patch` for compatible fixes, `minor` for compatible features, and `major` for breaking changes. Commit the generated Markdown file under `.changeset/` with the code change.

Check the pending release plan with:

```sh
pnpm changeset status
```

Release maintainers can run `pnpm version-packages` to update package versions and changelogs, then `pnpm release` to build and publish the packages.

## Code map

| Path | Contents |
|---|---|
| `package/headless/src/core` | Diagram session, controller, model, and selection mapping. |
| `package/headless/src/source` | Source-preserving mutations and diagram-specific helpers. |
| `package/headless/src/diagrams` | Diagram capability and classification. |
| `package/headless/src/runtime` | Diagram catalog, templates, and palette data. |
| `package/ui/src/ui` | React editor, components, context, and hooks. |
| `package/ui/src/diagrams` | Diagram adapters and source-to-model integration. |
| `package/ui/src/renderer` | Mermaid rendering integration. |
| `app/example/src` | Example application and its styles. |

## Making changes

- Put UI-independent state and source operations in `package/headless`.
- Put React-specific behavior and rendering in `package/ui`.
- Add or update focused tests beside the code they cover.
- Keep package entry points and TypeScript declarations aligned when changing exports.
- Update the README or user guide when a public API or behavior changes.

## Validate a package build

```sh
pnpm --filter @mermaid-editor-sdk/headless build
pnpm --filter @mermaid-editor-sdk/ui build
pnpm --filter @mermaid-editor-sdk/ui audit:distribution
```

Build output is written to each package's `dist/` directory and is ignored by Git.
