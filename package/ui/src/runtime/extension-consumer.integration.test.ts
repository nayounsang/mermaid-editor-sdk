import { describe, expect, it, vi } from 'vitest';

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(async () => ({ config: {} })),
  render: vi.fn(async () => ({ svg: '<svg></svg>', diagramType: 'flowchart-v2' })),
}));

vi.mock('mermaid', () => ({ default: mermaidMock }));

import { createMermaidVisualEditor } from '../index';

type MarkdownBlock = { code: string; start: number; end: number };

function findMermaidBlock(markdown: string): MarkdownBlock {
  const match = /```mermaid\s*\r?\n([\s\S]*?)\r?\n```/.exec(markdown);
  if (!match || match.index === undefined || match[1] === undefined) {
    throw new Error('No Mermaid block found.');
  }
  const codeStart = match.index + match[0].indexOf(match[1]);
  return { code: match[1], start: codeStart, end: codeStart + match[1].length };
}

function replaceMermaidBlock(markdown: string, code: string): string {
  const block = findMermaidBlock(markdown);
  return `${markdown.slice(0, block.start)}${code}${markdown.slice(block.end)}`;
}

describe('Extension consumer integration', () => {
  it('keeps Markdown block discovery and saving in the host while the SDK edits one Mermaid value', async () => {
    const container = document.createElement('div');
    let documentText = [
      '# Diagram notes',
      'Text before the diagram stays in the host document.',
      '```mermaid',
      'flowchart LR',
      '  A[Start] --> B[Finish]',
      '```',
      'Text after the diagram stays in the host document.',
    ].join('\n');
    const initialBlock = findMermaidBlock(documentText);
    const saveToHostDocument = vi.fn(async (value: string) => {
      documentText = replaceMermaidBlock(documentText, value);
    });
    const editor = createMermaidVisualEditor(container, {
      value: initialBlock.code,
      onSave: saveToHostDocument,
    });

    const source = container.querySelector<HTMLTextAreaElement>('.mve-source');
    expect(source).not.toBeNull();
    source!.value = 'flowchart LR\n  A[Start] --> B[Done]';
    source!.dispatchEvent(new Event('input', { bubbles: true }));
    expect(editor.getValue()).toBe('flowchart LR\n  A[Start] --> B[Done]');

    container.querySelector<HTMLButtonElement>('[aria-label="Save diagram"]')?.click();
    await vi.waitFor(() => expect(saveToHostDocument).toHaveBeenCalledOnce());
    expect(saveToHostDocument).toHaveBeenCalledWith(editor.getValue());
    expect(documentText).toContain('Text before the diagram stays in the host document.');
    expect(documentText).toContain('Text after the diagram stays in the host document.');
    expect(findMermaidBlock(documentText).code).toBe(editor.getValue());
    editor.destroy();
  });

  it('accepts a host-selected block update without echoing it back as a user edit', () => {
    const container = document.createElement('div');
    const onSave = vi.fn();
    const onChange = vi.fn();
    const editor = createMermaidVisualEditor(container, {
      value: 'sequenceDiagram\n  Alice->>Bob: Hi',
      onChange,
      onSave,
    });

    editor.setValue('sequenceDiagram\n  Alice->>Bob: Updated');

    expect(editor.getValue()).toBe('sequenceDiagram\n  Alice->>Bob: Updated');
    expect(container.querySelector<HTMLTextAreaElement>('.mve-source')?.value)
      .toBe(editor.getValue());
    expect(onChange).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
    editor.destroy();
  });
});
