import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditorShell } from '@mermaid-editor-sdk/ui/components';
import { EditorStatus, MermaidCanvas, SourceEditor, ToolSidebar } from '@mermaid-editor-sdk/ui';
import { DragDropProvider } from '@dnd-kit/react';
import { fixtureModel, flowchartSource, StoryFrame } from '../fixtures';

const meta = {
  title: 'Components/EditorShell',
  component: EditorShell,
  decorators: [(Story) => <DragDropProvider><StoryFrame className="storybook-editor-frame"><Story /></StoryFrame></DragDropProvider>],
} satisfies Meta<typeof EditorShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FlowchartWorkspace: Story = {
  args: {
    title: 'Release workflow',
    sidebar: <ToolSidebar model={fixtureModel} dispatch={() => undefined} onArmConnection={() => undefined} />,
    canvas: <MermaidCanvas
      source={flowchartSource}
      model={fixtureModel}
      onSelection={() => undefined}
      onRenderState={() => undefined}
      onSourceMutation={() => false}
      sourceRevision={fixtureModel.sourceRevision}
      onParseResult={() => undefined}
      onSave={() => undefined}
      onReset={() => undefined}
      onEditSelection={() => undefined}
    />,
    source: <SourceEditor value={flowchartSource} onChange={() => undefined} />,
    selection: null,
    status: <EditorStatus state="ready" message="Diagram ready." />,
  },
};
