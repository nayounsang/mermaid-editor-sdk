import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import {
  addState,
  addStateTransition,
  deleteState,
  deleteStateTransition,
  getStateStyle,
  getStateBorderType,
  listStateIds,
  listStateTransitions,
  renameState,
  setStateStyle,
  setStateBorderType,
  setStateTransition,
} from './state-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');

describe('state source mutations', () => {
  it('renames a state and edits one transition while preserving metadata, comments, nested states and opaque notes', async () => {
    const before = fixture('state-preservation.before.mmd');
    const after = renameState(before, 'StateA', 'Renamed');
    const transition = listStateTransitions(after).find((item) => item.source === 'Renamed' && item.target === 'StateB' && item.occurrence === 1)!;
    const changed = setStateTransition(after, transition, { label: 'revised' });
    expect(changed).toBe(fixture('state-preservation.after.mmd'));
    await Promise.all([mermaid.parse(before), mermaid.parse(changed)]);
  });

  it('lists ordinary states without treating initial markers as IDs and adds unique states and transitions', async () => {
    const source = 'stateDiagram-v2\n[*] --> Ready\nReady --> Done : finish\n';
    expect(listStateIds(source)).toEqual(['Ready', 'Done']);
    const withState = addState(source);
    expect(withState).toContain('state State1');
    const withTransition = addStateTransition(withState, 'Ready', 'State1', 'continue');
    expect(withTransition).toContain('Ready --> State1 : continue');
    await mermaid.parse(withTransition);
  });

  it('indexes and edits Unicode state IDs accepted by Mermaid', async () => {
    const source = 'stateDiagram-v2\n상태 --> 완료 : first\nA --> B : second\n';
    await mermaid.parse(source);
    expect(listStateIds(source)).toEqual(['상태', '완료', 'A', 'B']);
    const transitions = listStateTransitions(source);
    expect(transitions.map(({ source: from, target }) => [from, target])).toEqual([['상태', '완료'], ['A', 'B']]);
    const changed = setStateTransition(source, transitions[0]!, { label: 'revised' });
    expect(changed).toBe('stateDiagram-v2\n상태 --> 완료 : revised\nA --> B : second\n');
    await mermaid.parse(changed);
  });

  it('changes one duplicate transition occurrence and deletes only that transition', () => {
    const source = 'stateDiagram-v2\nA --> B : first\nA --> B : second\n';
    const item = listStateTransitions(source)[1]!;
    const updated = setStateTransition(source, item, { label: 'changed' });
    expect(updated).toBe('stateDiagram-v2\nA --> B : first\nA --> B : changed\n');
    expect(deleteStateTransition(updated, { ...item, occurrence: 1 })).toBe('stateDiagram-v2\nA --> B : first\n');
  });

  it('rejects a transition endpoint that Mermaid parses as an operator', async () => {
    const source = 'stateDiagram-v2\nA --> B\n';
    const edge = listStateTransitions(source)[0]!;
    await expect(mermaid.parse('stateDiagram-v2\nA --> New-State\n')).rejects.toThrow();
    expect(() => setStateTransition(source, edge, { target: 'New-State' })).toThrow(AmbiguousSourceMutationError);
    expect(source).toBe('stateDiagram-v2\nA --> B\n');
  });

  it('does not index or mutate transition-shaped text inside a note block', async () => {
    const source = 'stateDiagram-v2\nA --> B : first\nnote right of B\n  A --> B : literal note text\nend note\nA --> B : second\n';
    await mermaid.parse(source);
    const transitions = listStateTransitions(source);
    expect(transitions).toHaveLength(2);
    expect(transitions[1]?.occurrence).toBe(1);
    const changed = setStateTransition(source, transitions[1]!, { label: 'revised' });
    expect(changed).toBe('stateDiagram-v2\nA --> B : first\nnote right of B\n  A --> B : literal note text\nend note\nA --> B : revised\n');
    await mermaid.parse(changed);
  });

  it('adds and deletes a simple state with its transitions', () => {
    const source = 'stateDiagram-v2\nA --> B : next\n';
    const withState = addState(source, 'C');
    expect(deleteState(withState, 'B')).toBe('stateDiagram-v2\nstate C\n');
  });

  it('merges state fill and stroke styles and carries them through a rename', () => {
    const source = 'stateDiagram-v2\nA --> B\nstyle A fill:#ffc,stroke:#333,stroke-dasharray:4 2\n';
    const changed = setStateStyle(source, 'A', 'fill', '#fee');
    expect(changed).toContain('style A fill:#fee,stroke:#333,stroke-dasharray:4 2');
    expect(getStateStyle(changed, 'A', 'stroke')).toBe('#333');
    const renamed = renameState(changed, 'A', 'Ready');
    expect(renamed).toContain('style Ready fill:#fee,stroke:#333,stroke-dasharray:4 2');
    expect(deleteState(renamed, 'Ready')).not.toContain('style Ready');
  });

  it('reads comma-separated CSS values without splitting commas inside functions', () => {
    const source = 'stateDiagram-v2\nA --> B\nstyle A fill:rgb(255,0,0),stroke:#333\n';
    expect(getStateStyle(source, 'A', 'fill')).toBe('rgb(255,0,0)');
    expect(getStateStyle(source, 'A', 'stroke')).toBe('#333');
    expect(setStateStyle(source, 'A', 'stroke', '#666'))
      .toContain('style A fill:rgb(255,0,0),stroke:#666');
  });

  it('rejects unsupported style colors without altering the style statement', () => {
    const source = 'stateDiagram-v2\nA --> B\nstyle A fill:#ffc\n';
    expect(() => setStateStyle(source, 'A', 'fill', 'url(javascript:alert(1))')).toThrow(AmbiguousSourceMutationError);
    expect(source).toContain('fill:#ffc');
  });

  it('sets solid, dashed, and dotted state border styles', () => {
    const source = 'stateDiagram-v2\nA --> B\n';
    const dashed = setStateBorderType(source, 'A', 'dashed');
    expect(dashed).toContain('stroke-width:2px,stroke-dasharray:6 4');
    expect(getStateBorderType(dashed, 'A')).toBe('dashed');
    const dotted = setStateBorderType(dashed, 'A', 'dotted');
    expect(getStateBorderType(dotted, 'A')).toBe('dotted');
    expect(getStateBorderType(setStateBorderType(dotted, 'A', 'solid'), 'A')).toBe('solid');
  });

  it('rejects unsupported references and composite-state deletion without changing source', () => {
    const source = 'stateDiagram-v2\nstate A {\n  [*] --> Inner\n}\nA --> B\nnote right of B\n  A appears here\nend note\n';
    expect(() => renameState(source, 'A', 'Renamed')).toThrow(AmbiguousSourceMutationError);
    expect(() => deleteState(source, 'A')).toThrow(AmbiguousSourceMutationError);
    expect(() => deleteState('stateDiagram-v2\nstate A {\n  A --> Inner\n}\n', 'A')).toThrow(AmbiguousSourceMutationError);
    expect(source).toContain('A appears here');
  });

  it('rejects a rename when a note refers to that state ID', () => {
    const source = 'stateDiagram-v2\nA --> B\nnote right of B\n  A is referenced here\nend note\n';
    expect(() => renameState(source, 'A', 'Renamed')).toThrow(AmbiguousSourceMutationError);
    expect(source).toContain('A is referenced here');
  });

  it('rejects renaming a state with repeated declarations', async () => {
    const source = 'stateDiagram-v2\nstate A\nstate A\nA --> B\n';
    await mermaid.parse(source);
    expect(() => renameState(source, 'A', 'Renamed')).toThrow(AmbiguousSourceMutationError);
    expect(source).toBe('stateDiagram-v2\nstate A\nstate A\nA --> B\n');
  });

  it('rejects rename and deletion when a punctuation-ending state ID is referenced in a note', async () => {
    const source = 'stateDiagram-v2\nA. --> B\nnote right of B\n  keep A.\nend note\n';
    await mermaid.parse(source);
    expect(() => renameState(source, 'A.', 'Renamed')).toThrow(AmbiguousSourceMutationError);
    expect(() => deleteState(source, 'A.')).toThrow(AmbiguousSourceMutationError);
    expect(source).toContain('keep A.');
  });

  it('preserves CRLF and rejects multiline labels', () => {
    const source = 'stateDiagram-v2\r\nA --> B : old\r\n';
    const edge = listStateTransitions(source)[0]!;
    expect(setStateTransition(source, edge, { label: 'new' })).toBe('stateDiagram-v2\r\nA --> B : new\r\n');
    expect(setStateTransition(source, edge, { label: '' })).toBe('stateDiagram-v2\r\nA --> B\r\n');
    expect(() => setStateTransition(source, edge, { label: 'two\nlines' })).toThrow(AmbiguousSourceMutationError);
  });
});
