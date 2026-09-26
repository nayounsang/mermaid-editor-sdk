# Browser CSP validation

## Result

The generated browser IIFE runs with a consumer policy that omits `unsafe-eval`.
This was verified in Google Chrome against the built `dist/mermaid-visual-editor.iife.js` from a local HTTP server.

| Check | `script-src 'self'` | `script-src 'self' 'unsafe-eval'` |
| --- | --- | --- |
| Initial flowchart render reaches `ready` | Pass | Pass |
| Mermaid SVG appears | Pass | Pass |
| `getValue()` returns initial source | Pass | Pass |
| Source edit updates `getValue()` and fires `onChange` | Pass | Pass |
| `setValue()` updates source without echoing `onChange` | Pass | Pass |
| Browser CSP violation events | None | None |

The required policy for this fixture is:

```text
default-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src data: blob:;
font-src data:;
connect-src 'none';
object-src 'none';
base-uri 'none'
```

`style-src 'unsafe-inline'` is retained because Mermaid emits SVG style attributes. This check answers the script evaluation question; it does not establish a fully inline-free style policy or cover a host's other CSP directives.

## Reproduce

From the repository root, build and start the fixture server:

```sh
npm run build
npm run csp:fixture
```

Open each URL in a browser:

```text
http://127.0.0.1:4179/?mode=strict
http://127.0.0.1:4179/?mode=eval
```

The page writes a JSON result to `#result` and sets `data-result="pass"` only when the editor renders, source editing and external `setValue()` behave as expected, and no CSP violation event was observed. The first URL tests the consumer policy without `unsafe-eval`; the second is a comparison control. Stop the local server with Ctrl+C after both checks.

Fixture files:

- `docs/validation/csp-browser.html` loads the generated IIFE and stylesheet.
- `docs/validation/csp-browser.js` creates the editor, checks the initial render, simulates source editing, and checks external value synchronization.
- `scripts/serve-csp-fixture.mjs` serves the fixture and applies the selected CSP as an HTTP response header.

## Comparison with the baseline and design

The pinned [baseline Extension source](https://github.com/NextGenPowerToys/mermaid-visual-editor/blob/8f9bbc90f9f33a13cb5e2eda44100856795c4c01/vscode-extension/extension.js#L38-L62) injects `script-src 'unsafe-inline' 'unsafe-eval'` for its self-contained HTML and inline VS Code bridge. The SDK design instead calls for a generated browser bundle and explicitly makes its consumer CSP requirement a browser validation gate ([design](../mermaid-editor-sdk/DESIGN.md#8-구현-순서), [baseline notes](../research/injected-options.md)).

This is an intentional runtime difference: the generated SDK IIFE and tested editor operations work with `script-src 'self'`, so an SDK consumer does not need `unsafe-eval` for this tested flow. The comparison does not imply the baseline Extension can remove `unsafe-eval`; it still runs the original Mermaid 11.15.0 bundle and injects an inline bridge. **This difference is reported for user review before task 32 is marked complete.**

## Environment

- Build: `npm run build` (Vite 6.4.3 output, Mermaid dependency pinned to 11.17.2)
- Browser: Google Chrome on macOS; exact browser version was not recorded
- Origin: `http://127.0.0.1:4179`
- Date: 2026-09-26
