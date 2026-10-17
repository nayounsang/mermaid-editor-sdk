import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const roots = process.argv.slice(2).map((path) => resolve(path));

if (roots.length === 0) {
  throw new Error('Pass one or more generated API documentation directories.');
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && path.endsWith('.md') ? [path] : [];
  }));
  return nested.flat();
}

function splitTableRow(line) {
  const cells = [];
  let cell = '';

  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (character === '|') {
      let backslashes = 0;
      for (let previous = index - 1; previous >= 0 && line[previous] === '\\'; previous--) {
        backslashes++;
      }
      if (backslashes % 2 === 0) {
        cells.push(cell.trim());
        cell = '';
        continue;
      }
    }
    cell += character;
  }

  cells.push(cell.trim());
  if (cells[0] === '') cells.shift();
  if (cells.at(-1) === '') cells.pop();
  return cells;
}

async function normalizeFile(path) {
  const original = await readFile(path, 'utf8');
  const lines = original.split('\n');
  let inParameterTable = false;
  let hasDefaultColumn = false;
  let changed = false;

  const normalized = lines.map((line) => {
    if (/^\|\s*Parameter\s*\|\s*Type\s*\|/.test(line)) {
      inParameterTable = true;
      hasDefaultColumn = /\|\s*Default value\s*\|/.test(line);
      return line;
    }

    if (!inParameterTable) return line;
    if (!line.startsWith('|')) {
      inParameterTable = false;
      return line;
    }

    const cells = splitTableRow(line);
    if (cells.length < 2) return line;

    const parameterName = cells[0].replaceAll('`', '');
    let rowChanged = false;
    if (cells[1].length > 500 && parameterName === 'action') {
      cells[1] = '[`DiagramAction`](../type-aliases/DiagramAction.md)';
      rowChanged = true;
    }

    if (hasDefaultColumn && cells.length >= 4 && cells[2] === '`undefined`') {
      cells[2] = parameterName.endsWith('?') || parameterName.startsWith('...')
        ? '`undefined`'
        : '—';
      rowChanged = true;
    }

    if (!rowChanged) return line;
    changed = true;
    return `| ${cells.join(' | ')} |`;
  });

  if (changed) await writeFile(path, normalized.join('\n'));
}

for (const root of roots) {
  for (const file of await markdownFiles(root)) {
    await normalizeFile(file);
  }
}
