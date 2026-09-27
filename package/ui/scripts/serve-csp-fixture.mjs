/* global URL, process, console */

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.CSP_FIXTURE_PORT ?? 4179);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};
const assets = new Map([
  ['/', '../../.local/docs/validation/csp-browser.html'],
  ['/docs/validation/csp-browser.html', '../../.local/docs/validation/csp-browser.html'],
  ['/docs/validation/csp-browser.js', '../../.local/docs/validation/csp-browser.js'],
  ['/dist/style.css', 'dist/style.css'],
  ['/dist/mermaid-visual-editor.iife.js', 'dist/mermaid-visual-editor.iife.js'],
]);

createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const mode = url.searchParams.get('mode') === 'eval' ? 'eval' : 'strict';
  const policy = [
    "default-src 'none'",
    mode === 'eval' ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    'img-src data: blob:',
    'font-src data:',
    "connect-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
  ].join('; ');
  response.setHeader('Content-Security-Policy', policy);

  const asset = assets.get(url.pathname);
  if (!asset) {
    response.writeHead(404).end('Not found');
    return;
  }
  const file = resolve(root, asset);
  try {
    if (!statSync(file).isFile()) throw new Error('Not a file');
  } catch {
    response.writeHead(404).end('Not found');
    return;
  }
  response.setHeader('Content-Type', contentTypes[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`CSP fixture: http://127.0.0.1:${port}/?mode=strict`);
  console.log(`Eval control: http://127.0.0.1:${port}/?mode=eval`);
});
