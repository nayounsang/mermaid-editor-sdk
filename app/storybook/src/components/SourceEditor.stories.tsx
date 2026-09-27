import type { Meta, StoryObj } from '@storybook/react-vite';
import { SourceEditor } from 'mermaid-visual-editor-sdk';
import { flowchartSource, StoryFrame } from '../fixtures';

const meta = { title: 'Components/SourceEditor', component: SourceEditor, decorators: [(Story) => <StoryFrame><Story /></StoryFrame>] } satisfies Meta<typeof SourceEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FlowchartSource: Story = { args: { value: flowchartSource, onChange: () => undefined } };
