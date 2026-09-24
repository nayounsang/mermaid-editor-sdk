# Local playground

Start the browser playground from the repository root:

```sh
npm run dev
```

Vite opens the local page at `http://127.0.0.1:5173`. The default sample is a class diagram; the Class, Sequence, and Flowchart buttons load other built-in editor samples. Changes are kept in memory for that browser session and are not saved to disk.

The Class, Sequence, and Flowchart samples expose their current SDK editing tools above a wide canvas, with the Mermaid source editor below it. You can select a diagram element to reveal its editing controls, or edit the source directly. Mermaid 11.17.2 does not render the legacy `class ID : member` form, so that text-only syntax mutation can only be inspected in the source panel.

The local playground includes a compact editor shell, grouped tools, separate canvas and source panes, clearer selection feedback, and keyboard focus states based on the static visual study in [`/storybook.html`](../storybook.html). That reference page remains disconnected from the SDK runtime; only modal preview/close controls are interactive. See [task 37](tasks/37-sdk-ui-storybook.md).
