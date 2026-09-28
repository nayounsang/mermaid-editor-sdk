import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragDropProvider } from '@dnd-kit/react';
import { ToolSidebar } from '@mermaid-editor-sdk/ui';
import { fixtureModel, StoryFrame } from '../fixtures';

const meta = { title: 'Components/ToolSidebar', component: ToolSidebar, decorators: [(Story) => <DragDropProvider><StoryFrame><Story /></StoryFrame></DragDropProvider>] } satisfies Meta<typeof ToolSidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Flowchart: Story = { args: { model: fixtureModel, dispatch: () => undefined, onArmConnection: () => undefined } };
