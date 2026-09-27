import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditorSessionProvider, useDiagramSession, useEditorController } from 'mermaid-visual-editor-sdk';
import { EditorController } from '@mermaid-editor/headless';
import { flowchartSource, StoryFrame } from '../fixtures';

function SessionPreview() {
  const controller = useEditorController();
  const { snapshot } = useDiagramSession();
  return <section aria-label="Editor session summary">
    <h2>Editor session</h2>
    <p>Diagram type: {snapshot.model.diagramType}</p>
    <p>Source length: {snapshot.codeBlock.source.length} characters</p>
    <p>Controller source synchronized: {controller.session.getSnapshot().codeBlock.source === snapshot.codeBlock.source ? 'yes' : 'no'}</p>
  </section>;
}

function ProviderStory() {
  const controller = new EditorController(flowchartSource);
  return <EditorSessionProvider controller={controller}><SessionPreview /></EditorSessionProvider>;
}

const meta = { title: 'Components/EditorSessionProvider', component: ProviderStory, decorators: [(Story) => <StoryFrame><Story /></StoryFrame>] } satisfies Meta<typeof ProviderStory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithFlowchart: Story = {};
