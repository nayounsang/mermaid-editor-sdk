import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragDropProvider } from '@dnd-kit/react';
import { DiagramPalette } from 'mermaid-visual-editor-sdk';
import { fixtureModel, StoryFrame } from '../fixtures';

const meta = { title: 'Components/DiagramPalette', component: DiagramPalette, decorators: [(Story) => <DragDropProvider><StoryFrame><Story /></StoryFrame></DragDropProvider>] } satisfies Meta<typeof DiagramPalette>;
export default meta;
type Story = StoryObj<typeof meta>;

export const FlowchartTools: Story = { args: { model: fixtureModel, dispatch: () => undefined, onArmConnection: () => undefined } };
