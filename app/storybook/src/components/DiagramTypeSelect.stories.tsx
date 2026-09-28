import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiagramTypeSelect } from '@mermaid-editor-sdk/ui';
import { fixtureModel, StoryFrame } from '../fixtures';

const meta = { title: 'Components/DiagramTypeSelect', component: DiagramTypeSelect, decorators: [(Story) => <StoryFrame><Story /></StoryFrame>] } satisfies Meta<typeof DiagramTypeSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FlowchartSelected: Story = { args: { model: fixtureModel, onChange: () => undefined } };
