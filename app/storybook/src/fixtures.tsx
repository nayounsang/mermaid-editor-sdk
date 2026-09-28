import type { ReactNode } from 'react';
import { EditorController } from '@mermaid-editor-sdk/headless';
import type { EditorSelection } from '@mermaid-editor-sdk/ui';
import { EditorSessionProvider } from '@mermaid-editor-sdk/ui';

export const flowchartSource = `flowchart LR
  start([Start]) --> review{Review request}
  review -->|approved| publish[Publish update]
  review -->|changes needed| revise[Revise draft]
  revise --> review
  publish --> done([Done])`;

export const fixtureController = new EditorController(flowchartSource);
const initial = fixtureController.session.getSnapshot();
fixtureController.session.setParseResult(initial.model.sourceRevision, true);
export const fixtureSnapshot = fixtureController.session.getSnapshot();
export const fixtureModel = fixtureSnapshot.model;
export const fixtureSelection: EditorSelection = {
  kind: 'node',
  diagramType: 'flowchart',
  id: 'review',
};

export function StoryFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`storybook-story-frame ${className}`.trim()}>{children}</div>;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  return <EditorSessionProvider controller={fixtureController}>{children}</EditorSessionProvider>;
}
