import type { Meta, StoryObj } from '@storybook/react-vite';
import { SelectionEditor } from 'mermaid-visual-editor-sdk';
import { fixtureModel, fixtureSelection, StoryFrame } from '../fixtures';

const meta = { title: 'Components/SelectionEditor', component: SelectionEditor, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof SelectionEditor>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SelectedFlowchartNode: Story = {
  args: {
    open: true,
    onClose: () => undefined,
    selection: fixtureSelection,
    model: fixtureModel,
    dispatch: () => undefined,
  },
  decorators: [(Story) => <StoryFrame><Story /></StoryFrame>],
};
