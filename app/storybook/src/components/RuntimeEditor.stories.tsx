import { useEffect, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMermaidVisualEditor } from '@mermaid-editor-sdk/ui';
import { StoryFrame } from '../fixtures';

function RuntimeEditorPreview({ value }: { readonly value: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const editor = createMermaidVisualEditor(containerRef.current, { value });
    return () => editor.destroy();
  }, [value]);

  return <div ref={containerRef} />;
}

const meta = {
  title: 'Components/RuntimeEditor',
  component: RuntimeEditorPreview,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <StoryFrame className="storybook-editor-frame"><Story /></StoryFrame>],
} satisfies Meta<typeof RuntimeEditorPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClassDiagram: Story = {
  args: { value: 'classDiagram\nclass User {\n  +string name\n  +login()\n}' },
};

export const ERDiagram: Story = {
  args: { value: 'erDiagram\nCUSTOMER ||--o{ ORDER : places\nCUSTOMER {\n  string name PK\n  int id\n}' },
};
