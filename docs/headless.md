# Headless package

UI-independent Mermaid editing state and source mutation tools.

## Install

```sh
npm install @mermaid-editor-sdk/headless
# or
pnpm add @mermaid-editor-sdk/headless
# or
yarn add @mermaid-editor-sdk/headless
```

## Build one editor component

Use `DiagramSession` to make a source editor component. The session provides an observable snapshot and records edits for undo and redo.

```tsx
import { useSyncExternalStore } from 'react';
import { DiagramSession } from '@mermaid-editor-sdk/headless';

const session = new DiagramSession('flowchart LR\n  Start --> Done');

function SourceEditor({ session }: { session: DiagramSession }) {
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );

  return (
    <textarea
      aria-label="Mermaid source"
      value={snapshot.codeBlock.source}
      onChange={(event) => session.setSource(event.currentTarget.value, 'source-editor')}
    />
  );
}

export function App() {
  return <SourceEditor session={session} />;
}
```

## API reference

See [api/headless/README.md](api/headless/README.md).
