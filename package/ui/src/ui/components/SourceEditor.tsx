import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { useEffect, useState } from 'react';

export interface SourceEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

const extensions = [
  EditorView.lineWrapping,
  EditorView.contentAttributes.of({ 'aria-label': 'Mermaid code' }),
];

export function SourceEditor({ value, onChange }: SourceEditorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <section className="mve-source-panel" aria-label="Mermaid source editor">
      {mounted
        ? <CodeMirror className="mve-source" value={value} height="100%" minHeight="7rem" theme="light"
          extensions={extensions} onChange={onChange} basicSetup={{ foldGutter: true, highlightActiveLine: true, lineNumbers: true }} />
        : <textarea className="mve-source mve-source-fallback" aria-label="Mermaid code" value={value}
          onChange={(event) => onChange(event.currentTarget.value)} spellCheck={false} />}
    </section>
  );
}
