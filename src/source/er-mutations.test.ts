import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import {
  addERAttribute,
  addEREntity,
  addERRelationship,
  deleteERAttribute,
  deleteEREntity,
  deleteERRelationship,
  getERStyles,
  listERAttributes,
  listEREntityIds,
  listERRelationships,
  renameEREntity,
  setERAttribute,
  setERStyle,
  setERRelationship,
} from './er-mutations';
import { AmbiguousSourceMutationError } from './source-document';

const fixture = (name: string): string => readFileSync(resolve(process.cwd(), 'src/source/fixtures', name), 'utf8');

describe('ER source mutations', () => {
  it('edits one attribute and relationship while preserving key markers, comments, metadata, and other syntax', async () => {
    const before = fixture('er-preservation.before.mmd');
    const attribute = listERAttributes(before, 'CUSTOMER').find((item) => item.name === 'code')!;
    const withAttribute = setERAttribute(before, 'CUSTOMER', attribute, { type: 'varchar(32)' });
    const relationship = listERRelationships(withAttribute).find((item) => item.source === 'CUSTOMER' && item.target === 'ORDER')!;
    const after = setERRelationship(withAttribute, relationship, { cardinality: 'one-or-many', label: 'fulfills' });
    expect(after).toBe(fixture('er-preservation.after.mmd'));
    await Promise.all([mermaid.parse(before), mermaid.parse(after)]);
  });

  it('lists entities from blocks, bare declarations, and relationships', () => {
    const source = 'erDiagram\nCUSTOMER\nCUSTOMER ||--o{ ORDER : places\nORDER {\n  int id PK\n}\n';
    expect(listEREntityIds(source)).toEqual(['CUSTOMER', 'ORDER']);
    expect(listERAttributes(source, 'ORDER')).toEqual([{ entity: 'ORDER', type: 'int', name: 'id', key: 'PK', comment: '', occurrence: 0 }]);
  });

  it('indexes entities from valid alias-cardinality relationships while leaving unsupported edits guarded', async () => {
    const source = 'erDiagram\nA zero or one optionally to one or many B : relates\n';
    await mermaid.parse(source);
    expect(listEREntityIds(source)).toEqual(['A', 'B']);
    expect(listERRelationships(source)).toEqual([]);
    expect(() => renameEREntity(source, 'A', 'C')).toThrow(AmbiguousSourceMutationError);
  });

  it('adds an entity and connects existing entities with parseable source', async () => {
    const source = 'erDiagram\nCUSTOMER ||--o{ ORDER : places\n';
    const withEntity = addEREntity(source);
    expect(withEntity).toContain('Entity1 {\n}\n');
    const withRelationship = addERRelationship(withEntity, 'CUSTOMER', 'Entity1', 'many-many', 'related to');
    expect(withRelationship).toContain('CUSTOMER }o--o{ Entity1 : "related to"');
    await mermaid.parse(withRelationship);
  });

  it('renames one entity and updates its block and relationship endpoints only', async () => {
    const source = 'erDiagram\nCUSTOMER {\n  string id PK\n}\nCUSTOMER ||--o{ ORDER : places\n%% CUSTOMER stays in this comment\n';
    const changed = renameEREntity(source, 'CUSTOMER', 'CLIENT');
    expect(changed).toBe('erDiagram\nCLIENT {\n  string id PK\n}\nCLIENT ||--o{ ORDER : places\n%% CUSTOMER stays in this comment\n');
    await mermaid.parse(changed);
  });

  it('renames a quoted Unicode entity ID while retaining its quoted form', async () => {
    const source = 'erDiagram\n"顧客 台帳" ||--o{ ORDER : contains\nORDER {\n  int id PK\n}\n';
    expect(listEREntityIds(source)).toEqual(['顧客 台帳', 'ORDER']);
    const changed = renameEREntity(source, '顧客 台帳', '顧客 一覧');
    expect(changed).toContain('"顧客 一覧" ||--o{ ORDER : contains');
    await mermaid.parse(changed);
  });

  it('rejects entity rename when the ID appears in an unsupported statement', () => {
    const source = 'erDiagram\nCUSTOMER ||--o{ ORDER : places\naccTitle: CUSTOMER schema\n';
    expect(() => renameEREntity(source, 'CUSTOMER', 'CLIENT')).toThrow(AmbiguousSourceMutationError);
    expect(source).toContain('CUSTOMER ||--o{ ORDER');
  });

  it('deletes one entity and its attributes, style, and incident relationships', () => {
    const source = 'erDiagram\nCUSTOMER {\n  string id PK\n}\nORDER {\n  int id PK\n}\nCUSTOMER ||--o{ ORDER : places\nstyle CUSTOMER fill:#fff\n';
    expect(deleteEREntity(source, 'CUSTOMER')).toBe('erDiagram\nORDER {\n  int id PK\n}\n');
  });

  it('adds, edits, and deletes an attribute while preserving other attributes', async () => {
    const source = 'erDiagram\nCUSTOMER {\n  string id PK "main identifier"\n  string code FK, UK "lookup value"\n}\n';
    const attributes = listERAttributes(source, 'CUSTOMER');
    const edited = setERAttribute(source, 'CUSTOMER', attributes[0]!, { name: 'customer_id' });
    expect(edited).toContain('string customer_id PK "main identifier"');
    const withAttribute = addERAttribute(edited, 'CUSTOMER', { type: 'date', name: 'created_at' });
    expect(withAttribute).toContain('date created_at');
    const result = deleteERAttribute(withAttribute, 'CUSTOMER', { name: 'code', occurrence: 0 });
    expect(result).not.toContain('lookup value');
    expect(result).toContain('string customer_id PK "main identifier"');
    await mermaid.parse(result);
  });

  it('changes one duplicate relationship and deletes only that occurrence', () => {
    const source = 'erDiagram\nA ||--o{ B : first\nA ||--o{ B : second\n';
    const relationship = listERRelationships(source)[1]!;
    const edited = setERRelationship(source, relationship, { cardinality: 'many-many', label: 'updated' });
    expect(edited).toBe('erDiagram\nA ||--o{ B : first\nA }o--o{ B : updated\n');
    expect(deleteERRelationship(edited, { ...relationship, occurrence: 1 })).toBe('erDiagram\nA ||--o{ B : first\n');
  });

  it('round trips every supported cardinality marker', async () => {
    const source = 'erDiagram\nA ||--o{ B : related\n';
    const relationship = listERRelationships(source)[0]!;
    const markers = [
      ['one-one', 'A ||--|| B'],
      ['one-many', 'A ||--o{ B'],
      ['many-many', 'A }o--o{ B'],
      ['zero-one', 'A |o--|| B'],
      ['one-or-many', 'A ||--|{ B'],
    ] as const;
    for (const [cardinality, marker] of markers) {
      const updated = setERRelationship(source, relationship, { cardinality, identifying: false });
      expect(updated).toContain(marker.replace('--', '..'));
      await mermaid.parse(updated);
    }
  });

  it('preserves CRLF line endings when adding ER entities, attributes, and relationships', async () => {
    const source = 'erDiagram\r\nA {\r\n  int id PK\r\n}\r\nB {\r\n}\r\n';
    const withAttribute = addERAttribute(source, 'A', { name: 'code', type: 'string' });
    const withEntity = addEREntity(withAttribute, 'C');
    const withRelationship = addERRelationship(withEntity, 'A', 'B', 'one-one', 'relates');
    expect(withAttribute).toContain('  string code\r\n');
    expect(withEntity).toContain('C {\r\n}\r\n');
    expect(withRelationship.endsWith('A ||--|| B : relates\r\n')).toBe(true);
    expect(withRelationship.replace(/\r\n/g, '')).not.toContain('\n');
    await mermaid.parse(withRelationship);
  });

  it('preserves CRLF while updating and deleting ER attributes, relationships, and entities', async () => {
    const source = 'erDiagram\r\nA {\r\n  int id PK\r\n  string code\r\n}\r\nB {\r\n  int id PK\r\n}\r\nA ||--o{ B : relates\r\n';
    const attributes = listERAttributes(source, 'A');
    const withUpdatedAttribute = setERAttribute(source, 'A', attributes[0]!, { type: 'bigint' });
    const withDeletedAttribute = deleteERAttribute(withUpdatedAttribute, 'A', attributes[1]!);
    const relationship = listERRelationships(withDeletedAttribute)[0]!;
    const withUpdatedRelationship = setERRelationship(withDeletedAttribute, relationship, { label: 'owns' });
    const withoutRelationship = deleteERRelationship(withUpdatedRelationship, relationship);
    const result = deleteEREntity(withoutRelationship, 'A');
    expect(result).toBe('erDiagram\r\nB {\r\n  int id PK\r\n}\r\n');
    expect(result.replace(/\r\n/g, '')).not.toContain('\n');
    await mermaid.parse(result);
  });

  it('reads and updates quoted relationship labels without exposing their quotes', () => {
    const source = 'erDiagram\nA ||--o{ B : "owns many records"\n';
    const relationship = listERRelationships(source)[0]!;
    expect(relationship.label).toBe('owns many records');
    expect(setERRelationship(source, relationship, { label: 'stores records' }))
      .toBe('erDiagram\nA ||--o{ B : "stores records"\n');
  });

  it('rejects a relationship with a missing or identical endpoint', () => {
    const source = 'erDiagram\nA ||--o{ B : related\n';
    expect(() => addERRelationship(source, 'A', 'A')).toThrow(AmbiguousSourceMutationError);
    expect(() => addERRelationship(source, 'A', 'Missing')).toThrow(AmbiguousSourceMutationError);
  });

  it('updates an entity style without replacing unrelated style properties', () => {
    const source = 'erDiagram\nA ||--o{ B : related\nstyle A fill:#fff,stroke:#333\n';
    expect(getERStyles(source, 'A')).toEqual({ fill: '#fff', stroke: '#333' });
    expect(setERStyle(source, 'A', 'fill', '#fee')).toContain('style A fill:#fee,stroke:#333');
  });

  it('reads function colors without splitting their internal commas', () => {
    const source = 'erDiagram\nA ||--o{ B : related\nstyle A fill:rgb(255,0,0),stroke:#333\n';
    expect(setERStyle(source, 'A', 'stroke', '#666')).toContain('style A fill:rgb(255,0,0),stroke:#666');
  });
});
