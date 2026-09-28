import type { Meta, StoryObj } from '@storybook/react-vite';
import { MermaidEditor } from '@mermaid-editor-sdk/ui';
import { flowchartSource, StoryFrame } from '../fixtures';

const meta = {
  title: 'Components/MermaidEditor',
  component: MermaidEditor,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <StoryFrame className="storybook-editor-frame"><Story /></StoryFrame>],
} satisfies Meta<typeof MermaidEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Flowchart: Story = { args: { value: flowchartSource, title: 'Release workflow' } };

export const ClassDiagram: Story = {
  args: {
    value: 'classDiagram\nclass User {\n  +string name\n  +login()\n}',
    title: 'Class diagram',
  },
};

export const ERDiagram: Story = {
  args: {
    value: 'erDiagram\nCUSTOMER ||--o{ ORDER : places\nCUSTOMER {\n  string name PK\n  int id\n}',
    title: 'ER diagram',
  },
};

export const StateDiagram: Story = {
  args: {
    value: 'stateDiagram-v2\n[*] --> Idle\nIdle --> Working : start\nWorking --> Done : finish\nDone --> [*]',
    title: 'State diagram',
  },
};

export const SequenceDiagram: Story = {
  args: {
    value: 'sequenceDiagram\nparticipant A as Alice\nparticipant B as Bob\nA->>B: Request\nB-->>A: Response',
    title: 'Sequence diagram',
  },
};

export const GanttDiagram: Story = {
  args: {
    value: 'gantt\ntitle Project plan\ndateFormat YYYY-MM-DD\nsection Build\nImplement UI :active, ui, 2026-09-01, 5d\nReview :review, after ui, 3d',
    title: 'Project plan',
  },
};
