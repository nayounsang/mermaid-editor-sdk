# React playground

Start the browser playground from the repository root:

```sh
npm run dev
```

Vite opens the local page at `http://127.0.0.1:5173` with a Flowchart sample. The playground mounts one Mermaid code block in the React editor. Source and palette edits stay in memory until Save; Save stores the current source in local storage for that browser session.

The playground mounts the package's React `MermaidEditor` under `StrictMode`. It supports source edits, Mermaid preview, diagram palettes, selection editing, history, zoom controls, and host-provided save behavior.

The static visual reference in [`/storybook.html`](../storybook.html) remains disconnected from the SDK runtime; only modal preview/close controls are interactive. See [task 37](tasks/37-sdk-ui-storybook.md) and the ongoing [React migration](tasks/38-react-migration.md).
