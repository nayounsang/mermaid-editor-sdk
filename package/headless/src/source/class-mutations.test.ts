import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import {
  addClassMember,
  addClassNode,
  addClassRelation,
  deleteClassNode,
  listClassIds,
  listClassMembers,
  listClassRelations,
  renameClassNode,
  setClassStyle,
  setClassMember,
  setClassRelation,
} from './class-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');

describe('Class diagram source mutations', () => {
  it('round-trips a member and relationship endpoint/operator while preserving opaque syntax', async () => {
    const before = fixture('class-preservation.before.mmd');
    const expected = fixture('class-preservation.after.mmd');
    const relation = listClassRelations(before)[0]!;
    const memberChanged = setClassMember(before, 'User', '+id: Map<String, User>', '+id: ReadonlyMap<String, User>');
    const actual = setClassRelation(memberChanged, relation, { source: 'Admin', operator: '*--' });

    expect(actual).toBe(expected);
    await Promise.all([mermaid.parse(before), mermaid.parse(actual)]);
    expect(actual.slice(0, actual.indexOf('+id:'))).toBe(before.slice(0, before.indexOf('+id:')));
    expect(listClassMembers(before, 'User')).toContain('+id: Map<String, User>');
    expect(listClassIds(before)).toEqual(['User', 'Account']);
  });

  it('adds classes and relations without normalizing existing source', () => {
    const before = 'classDiagram\r\nclass Existing\r\n';
    const withClass = addClassNode(before);
    expect(withClass).toBe('classDiagram\r\nclass Existing\r\nclass Class1 {\r\n  \r\n}\r\n');
    expect(addClassRelation(withClass, 'Existing', 'Class1')).toBe(`${withClass}Existing --> Class1\r\n`);
  });

  it('adds a member inside one identified class block', () => {
    expect(addClassMember('classDiagram\nclass A {\n  +id: string\n}\n', 'A'))
      .toBe('classDiagram\nclass A {\n  +id: string\n  +operation(): void\n}\n');
  });

  it('turns a simple class declaration into a member block when adding the first member', async () => {
    const source = 'classDiagram\nclass Animal\n';
    const added = addClassMember(source, 'Animal');
    expect(added).toBe('classDiagram\nclass Animal {\n  +operation(): void\n}\n');
    expect(listClassMembers(added, 'Animal')).toEqual(['+operation(): void']);
    await mermaid.parse(added);
  });

  it('edits colon-form class members and appends a member in the same syntax', () => {
    const source = 'classDiagram\nclass Animal\nAnimal : +name: String\nAnimal : +age: int\n';
    const edited = setClassMember(source, 'Animal', '+name: String', '+name: Unicode');
    const added = addClassMember(edited, 'Animal');
    expect(listClassMembers(added, 'Animal')).toEqual(['+name: Unicode', '+age: int', '+operation(): void']);
    expect(added).toContain('Animal : +name: Unicode');
  });

  it('supports Unicode and dashed class IDs in declarations and relations', async () => {
    const source = 'classDiagram\nclass User-계정 {\n  +id: string\n}\nUser-계정 --> Account\n';
    expect(listClassIds(source)).toEqual(['User-계정', 'Account']);
    expect(listClassRelations(source)).toEqual([{ source: 'User-계정', target: 'Account', operator: '-->', occurrence: 0 }]);
    const renamed = renameClassNode(source, 'User-계정', 'Customer-Δ');

    expect(renamed).toContain('class Customer-Δ {');
    expect(renamed).toContain('Customer-Δ --> Account');
    await mermaid.parse(renamed);
  });

  it('does not expose comments or annotations as editable members', () => {
    const source = 'classDiagram\nclass A {\n  %% keep this note\n  <<entity>>\n  +id: string\n}\n';
    expect(listClassMembers(source, 'A')).toEqual(['+id: string']);
    expect(() => setClassMember(source, 'A', '<<entity>>', '+changed')).toThrow(AmbiguousSourceMutationError);
    expect(() => setClassMember(source, 'A', '%% keep this note', 'changed')).toThrow(AmbiguousSourceMutationError);
  });

  it('rejects ambiguous duplicate members without mutation', () => {
    const source = 'classDiagram\nclass A {\n  +id: string\n  +id: string\n}\n';
    expect(() => setClassMember(source, 'A', '+id: string', '+key: string')).toThrow(AmbiguousSourceMutationError);
  });

  it('rejects adding a class to a non-class source', () => {
    expect(() => addClassNode('flowchart LR\nA --> B')).toThrow(AmbiguousSourceMutationError);
  });

  it('rejects self-relations', () => {
    const source = 'classDiagram\nclass A\n';
    expect(() => addClassRelation(source, 'A', 'A')).toThrow(AmbiguousSourceMutationError);
  });

  it('adds a class and relation without normalizing existing source', () => {
    const source = 'classDiagram\r\nclass Existing\r\n';
    const withClass = addClassNode(source);
    expect(withClass).toBe('classDiagram\r\nclass Existing\r\nclass Class1 {\r\n  \r\n}\r\n');
    expect(addClassRelation(withClass, 'Existing', 'Class1')).toBe(`${withClass}Existing --> Class1\r\n`);
  });

  it('updates a class style locally', () => {
    const source = 'classDiagram\nclass A\n';
    const styled = setClassStyle(source, 'A', 'fill', '#abcdef');
    expect(styled).toContain('style A fill:#abcdef');
    expect(setClassStyle(styled, 'A', 'fill', '#fedcba')).toContain('style A fill:#fedcba');
    expect(setClassStyle(styled, 'A', 'stroke-dasharray', '6 4')).toContain('fill:#abcdef,stroke-dasharray:6 4');
  });

  it('deletes only a safely recognized class and its relations', () => {
    const source = 'classDiagram\nclass A {\n  +id: string\n}\nclass B\nA --> B\n%% A is mentioned here\n';
    expect(deleteClassNode(source, 'A')).toBe('classDiagram\nclass B\n%% A is mentioned here\n');
  });

  it('rejects deleting a class that has opaque references', () => {
    const source = 'classDiagram\nclass A\nnote for A\n';
    expect(() => deleteClassNode(source, 'A')).toThrow(AmbiguousSourceMutationError);
  });

  it('renames only a class declaration and parsed relation endpoints, preserving comments', () => {
    const source = 'classDiagram\nclass User\nUser "1" --> Account\n%% User remains in this comment\n';
    expect(renameClassNode(source, 'User', 'Person'))
      .toBe('classDiagram\nclass Person\nPerson "1" --> Account\n%% User remains in this comment\n');
    expect(() => renameClassNode(`${source}note for User`, 'User', 'Person')).toThrow(AmbiguousSourceMutationError);
  });
});
