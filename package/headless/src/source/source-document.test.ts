import { describe, expect, it } from 'vitest';
import { AmbiguousSourceMutationError, appendSourceLines, SourceDocument } from './source-document';

describe('SourceDocument', () => {
  it('does not change source when there are no lines to append', () => {
    expect(appendSourceLines('flowchart LR\nA-->B', [], 'flowchart')).toBe('flowchart LR\nA-->B');
  });

  it('appends after headers when only comments or whitespace follow', () => {
    expect(appendSourceLines('flowchart LR\n%% keep\n', ['C-->D'], 'flowchart'))
      .toBe('flowchart LR\n%% keep\nC-->D\n');
    expect(appendSourceLines('', ['flowchart LR'], 'flowchart')).toBe('flowchart LR');
  });

  it('replaces one simple statement and preserves BOM, CRLF, comments, and untouched text', () => {
    const source = '\uFEFF---\r\ntitle: Demo\r\n---\r\nflowchart LR\r\n%% A comment\r\nA[old]\r\nB[keep]';
    const document = new SourceDocument(source, 'flowchart');
    const region = document.findUniqueEditableStatement('A[old]');

    expect(document.replaceStatement(region.start, region.end, 'A[new]'))
      .toBe('\uFEFF---\r\ntitle: Demo\r\n---\r\nflowchart LR\r\n%% A comment\r\nA[new]\r\nB[keep]');
  });

  it('rejects duplicate, opaque, and non-statement spans', () => {
    const document = new SourceDocument('flowchart LR\n%% A[old]\nA[old]\nA[old]', 'flowchart');
    expect(() => document.findUniqueEditableStatement('A[old]')).toThrow(AmbiguousSourceMutationError);
    expect(() => document.replaceStatement(13, 22, '%% changed')).toThrow(AmbiguousSourceMutationError);
  });

  it('preserves an unterminated final line and treats unchanged replacements as no-ops', () => {
    const document = new SourceDocument('A[old]', 'flowchart');
    const region = document.findUniqueEditableStatement('A[old]');
    expect(Object.isFrozen(document.regions)).toBe(true);
    expect(Object.isFrozen(region)).toBe(true);
    expect(document.replaceStatement(region.start, region.end, 'A[old]')).toBe('A[old]');
    expect(document.replaceStatement(region.start, region.end, 'A[new]')).toBe('A[new]');
  });

  it('does not expose node-shaped lines in unknown diagrams or allow multiline replacements', () => {
    const source = 'architecture-beta\nA[looks like a node]';
    const opaqueDocument = new SourceDocument(source, 'unsupported');
    expect(() => opaqueDocument.findUniqueEditableStatement('A[looks like a node]'))
      .toThrow(AmbiguousSourceMutationError);

    const flowchart = new SourceDocument('flowchart LR\nA[old]', 'flowchart');
    const region = flowchart.findUniqueEditableStatement('A[old]');
    expect(() => flowchart.replaceStatement(region.start, region.end, 'A[new]\nB[injected]'))
      .toThrow(AmbiguousSourceMutationError);
    expect(() => flowchart.replaceStatement(region.start, region.end, 'B[new]'))
      .toThrow(AmbiguousSourceMutationError);
  });
});
