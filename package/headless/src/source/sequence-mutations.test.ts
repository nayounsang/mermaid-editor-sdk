import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mermaid from 'mermaid';
import { describe, expect, it } from 'vitest';
import { addSequencePaletteItem, type SequencePaletteItemId } from './sequence-mutations';

const beforeFixture = readFileSync(resolve(process.cwd(), 'src/source/fixtures/sequence-preservation.before.mmd'), 'utf8');
const afterFixture = readFileSync(resolve(process.cwd(), 'src/source/fixtures/sequence-preservation.after.mmd'), 'utf8');

describe('sequence source mutations', () => {
  it('adds a message through existing participant IDs and preserves the original source verbatim', async () => {
    const result = addSequencePaletteItem(beforeFixture, 'message-sync');

    expect(result).toBe(afterFixture);
    expect(result.slice(0, beforeFixture.length)).toBe(beforeFixture);
    await expect(mermaid.parse(result)).resolves.toBeTruthy();
  });

  it('reuses implicit participants from existing messages', () => {
    const source = 'sequenceDiagram\n    Alice->>Bob: existing exchange\n';

    expect(addSequencePaletteItem(source, 'message-sync')).toBe(
      `${source}    Alice->>Bob: message\n`,
    );
  });

  it('does not infer message participants from Mermaid comments', () => {
    const source = 'sequenceDiagram\n    %% Foo-->>Bar: commented example\n';

    expect(addSequencePaletteItem(source, 'message-sync')).toBe(
      `${source}    A->>B: message\n`,
    );
  });

  it('scans long non-message lines without interpreting them as participants', () => {
    const source = `sequenceDiagram\n    a${'-'.repeat(20_000)}\n`;

    expect(addSequencePaletteItem(source, 'message-sync')).toBe(
      `${source}    A->>B: message\n`,
    );
  });

  it.each([
    '->', '-->', '->>', '-->>', '<<->>', '<<-->>', '-x', '--x', '-)', '--)',
    '-|\\', '--|\\', '-|/', '--|/', '/|-', '/|--', '\\\\-', '\\\\--',
    '-\\\\', '--\\\\', '-//', '--//', '//-', '//--',
  ])('reuses implicit participants from %s message arrows', async (arrow) => {
    const source = `sequenceDiagram\n    Alice${arrow}Bob: existing exchange\n`;

    expect(addSequencePaletteItem(source, 'message-sync')).toBe(
      `${source}    Alice->>Bob: message\n`,
    );
    await expect(mermaid.parse(source)).resolves.toBeTruthy();
  });

  it.each(['Alice()->>Bob', 'Alice->>()Bob'])('reuses IDs from central connection %s', async (message) => {
    const source = `sequenceDiagram\n    ${message}: existing exchange\n`;

    expect(addSequencePaletteItem(source, 'message-sync')).toBe(
      `${source}    Alice->>Bob: message\n`,
    );
    await expect(mermaid.parse(source)).resolves.toBeTruthy();
  });

  it('preserves BOM, CRLF, and the absence of a final newline', () => {
    const source = '\uFEFFsequenceDiagram\r\n    participant API as Service\r\n    participant UI as Browser';
    const result = addSequencePaletteItem(source, 'message-sync');

    expect(result).toBe(`${source}\r\n    API->>UI: message`);
    expect(result.endsWith('\n')).toBe(false);
  });

  it('adds unique participant IDs without changing existing declarations or references', () => {
    const source = 'sequenceDiagram\n    participant Participant1\n    actor Actor1\n    Participant1->>Actor1: keep\n';

    expect(addSequencePaletteItem(source, 'participant')).toBe(
      `${source}    participant Participant2\n`,
    );
    expect(addSequencePaletteItem(source, 'actor')).toBe(
      `${source}    actor Actor2\n`,
    );
  });

  it('keeps all supported message and block templates parseable', async () => {
    const messageAndBlockItems: SequencePaletteItemId[] = [
      'message-reply', 'message-activate', 'message-deactivate', 'message-async', 'note', 'loop', 'alt', 'opt', 'parallel',
    ];
    const source = 'sequenceDiagram\n    participant A\n    participant B\n';

    for (const item of messageAndBlockItems) {
      const base = item === 'message-deactivate'
        ? `${source}    A->>+B: request\n`
        : source;
      const result = addSequencePaletteItem(base, item);
      await expect(mermaid.parse(result), item).resolves.toBeTruthy();
    }
  });

  it('rejects non-sequence sources without changing the supplied text', () => {
    const source = 'flowchart LR\nA --> B';

    expect(() => addSequencePaletteItem(source, 'message-sync')).toThrow(/sequenceDiagram/);
  });
});
