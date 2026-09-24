# Local playground

Start the browser playground from the repository root:

```sh
npm run dev
```

Vite opens the local page at `http://127.0.0.1:5173`. The default sample is a class diagram; the Class, Sequence, and Flowchart buttons load other built-in editor samples. Changes are kept in memory for that browser session and are not saved to disk.

The class sample lets you try class and relationship selection, adding classes, changing relation operators and endpoints, editing members, changing fill and stroke colors, and editing the source directly. A newly added class is selected and its name field is focused. Double-click a class name to start renaming; press Enter to apply. To connect classes, choose an operator, click **Connect classes**, then click a start class and a target class. Mermaid 11.17.2 does not render the legacy `class ID : member` form, so that text-only syntax mutation can only be inspected in the source panel.
