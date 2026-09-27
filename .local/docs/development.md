# Monorepo development

Install the pinned workspace dependencies and start the Vite example from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Turbo runs `app/example` at `http://127.0.0.1:5173`. Vite resolves the public `mermaid-visual-editor-sdk` and `@mermaid-editor/headless` workspace exports to their TypeScript sources in development, so UI and headless changes trigger HMR. The example mounts one Mermaid code block in the React editor. Source and palette edits stay in memory until Save; Save stores the current source in local storage for that browser session.

Useful root commands:

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm audit:distribution
```

Turbo builds `@mermaid-editor/headless` before `mermaid-visual-editor-sdk`, then builds the example consumer. The playground mounts the SDK's React `MermaidEditor` under `StrictMode`. It supports source edits, Mermaid preview, diagram palettes, selection editing, history, zoom controls, and host-provided save behavior.

See the [monorepo design](monorepo-design.md), [task 37](tasks/37-sdk-ui-storybook.md), [React migration](tasks/38-react-migration.md), and [monorepo migration](tasks/39-turbo-monorepo.md).
