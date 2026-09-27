import { AmbiguousSourceMutationError, appendSourceLines } from './source-document';

export type SequencePaletteItemId =
  | 'participant'
  | 'actor'
  | 'message-sync'
  | 'message-reply'
  | 'message-activate'
  | 'message-deactivate'
  | 'message-async'
  | 'note'
  | 'loop'
  | 'alt'
  | 'opt'
  | 'parallel';

const sequencePaletteSnippets: Record<SequencePaletteItemId, string> = {
  participant: 'participant Participant1',
  actor: 'actor Actor1',
  'message-sync': 'A->>B: message',
  'message-reply': 'B-->>A: reply',
  'message-activate': 'A->>+B: request',
  'message-deactivate': 'B-->>-A: response',
  'message-async': 'A-)B: async',
  note: 'Note over A,B: note here',
  loop: 'loop every minute\n    \nend',
  alt: 'alt success\n    \nelse failure\n    \nend',
  opt: 'opt if condition\n    \nend',
  parallel: 'par task one\n    \nand task two\n    \nend',
};

function listDeclaredParticipants(source: string): string[] {
  const participants = new Set<string>();
  for (const line of source.split(/\r\n|\n|\r/)) {
    const match = /^\s*(?:participant|actor)\s+([A-Za-z_][\w.-]*)(?=\s|$)/i.exec(line);
    if (match) participants.add(match[1]!);
  }
  return [...participants];
}

const sequenceMessageArrows = [
  '<<-->>', '<<->>', '-->>', '->>', '-->', '->', '--x', '-x', '--)', '-)',
  '--|\\', '-|\\', '--|/', '-|/', '\\\\--', '\\\\-', '--\\\\', '-\\\\',
  '/|--', '/|-', '--//', '-//', '//--', '//-',
];

function parseMessageParticipants(line: string): [string, string] | undefined {
  const start = line.search(/\S/);
  if (start < 0) return undefined;

  for (let arrowStart = start; arrowStart < line.length;) {
    const marker = line[arrowStart];
    if (marker === '-' || marker === '<' || marker === '/' || marker === '\\') {
      const arrow = sequenceMessageArrows.find((candidate) => line.startsWith(candidate, arrowStart));
      if (arrow) {
        let sender = line.slice(start, arrowStart).trimEnd();
        if (sender.endsWith('()')) sender = sender.slice(0, -2).trimEnd();
        if (!/^[\w.-]+$/.test(sender)) return undefined;

        let recipientStart = arrowStart + arrow.length;
        while (recipientStart < line.length && /\s/.test(line[recipientStart]!)) recipientStart++;
        if (line.startsWith('()', recipientStart)) recipientStart += 2;
        while (recipientStart < line.length && /\s/.test(line[recipientStart]!)) recipientStart++;
        if (line[recipientStart] === '+' || line[recipientStart] === '-') recipientStart++;
        while (recipientStart < line.length && /\s/.test(line[recipientStart]!)) recipientStart++;

        let recipientEnd = recipientStart;
        while (recipientEnd < line.length && /[\w.-]/.test(line[recipientEnd]!)) recipientEnd++;
        const recipient = line.slice(recipientStart, recipientEnd);
        return recipient ? [sender, recipient] : undefined;
      }
    }

    if (/\s/.test(marker!) || /[\w.-]/.test(marker!)) {
      arrowStart++;
      continue;
    }
    if (line.startsWith('()', arrowStart)) {
      arrowStart += 2;
      continue;
    }
    return undefined;
  }
  return undefined;
}

function listMessageParticipants(source: string): string[] {
  const participants = new Set<string>();
  for (const line of source.split(/\r\n|\n|\r/)) {
    const message = parseMessageParticipants(line);
    if (!message) continue;
    participants.add(message[0]);
    participants.add(message[1]);
  }
  return [...participants];
}

function getMessageParticipants(source: string): [string, string] {
  const declared = listDeclaredParticipants(source);
  const seen = new Set(declared);
  for (const participant of listMessageParticipants(source)) {
    if (!seen.has(participant)) {
      seen.add(participant);
      declared.push(participant);
    }
  }
  if (declared.length >= 2) return [declared[0]!, declared[1]!];
  if (declared.length === 1) return [declared[0]!, declared[0] === 'B' ? 'A' : 'B'];
  return ['A', 'B'];
}

function makeUniqueParticipantId(source: string, prefix: 'Participant' | 'Actor'): string {
  const used = new Set(source.match(/[A-Za-z_][\w.-]*/g) ?? []);
  let number = 1;
  while (used.has(`${prefix}${number}`)) number++;
  return `${prefix}${number}`;
}

function getSnippet(source: string, item: SequencePaletteItemId): string {
  if (item === 'participant') return `participant ${makeUniqueParticipantId(source, 'Participant')}`;
  if (item === 'actor') return `actor ${makeUniqueParticipantId(source, 'Actor')}`;

  const [first, second] = getMessageParticipants(source);
  return sequencePaletteSnippets[item].replace(/\bA\b/g, first).replace(/\bB\b/g, second);
}

/** Adds one built-in sequence palette item while retaining every existing source code unit. */
export function addSequencePaletteItem(source: string, item: SequencePaletteItemId): string {
  if (!Object.hasOwn(sequencePaletteSnippets, item)) {
    throw new AmbiguousSourceMutationError('The sequence palette item is not supported.');
  }
  if (!/^\uFEFF?\s*sequenceDiagram\b/im.test(source)) {
    throw new AmbiguousSourceMutationError('A sequence palette item requires a sequenceDiagram source.');
  }

  const snippet = getSnippet(source, item);
  return appendSourceLines(source, snippet.split('\n').map((line) => `    ${line}`), 'sequence');
}
