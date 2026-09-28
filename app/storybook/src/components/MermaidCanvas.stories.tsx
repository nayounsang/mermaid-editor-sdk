import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragDropProvider } from '@dnd-kit/react';
import { MermaidCanvas } from '@mermaid-editor-sdk/ui';
import { fixtureModel, flowchartSource, StoryFrame } from '../fixtures';

const meta = { title: 'Components/MermaidCanvas', component: MermaidCanvas, decorators: [(Story) => <DragDropProvider><StoryFrame><Story /></StoryFrame></DragDropProvider>] } satisfies Meta<typeof MermaidCanvas>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FlowchartPreview: Story = {
  args: {
    source: flowchartSource,
    model: fixtureModel,
    onSelection: () => undefined,
    onRenderState: () => undefined,
    onSourceMutation: () => false,
    sourceRevision: fixtureModel.sourceRevision,
    onParseResult: () => undefined,
    onSave: () => undefined,
    onReset: () => undefined,
    onEditSelection: () => undefined,
  },
};
