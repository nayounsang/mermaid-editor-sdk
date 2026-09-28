import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditorStatus } from '@mermaid-editor-sdk/ui';
import { StoryFrame } from '../fixtures';

const meta = { title: 'Components/EditorStatus', component: EditorStatus, decorators: [(Story) => <StoryFrame><Story /></StoryFrame>] } satisfies Meta<typeof EditorStatus>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Ready: Story = { args: { state: 'ready', message: 'Diagram ready.' } };
export const Loading: Story = { args: { state: 'loading', message: 'Rendering Mermaid preview…' } };
export const Error: Story = { args: { state: 'error', message: 'The diagram source has a syntax error.' } };
