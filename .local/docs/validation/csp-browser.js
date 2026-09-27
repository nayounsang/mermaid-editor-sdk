/* global document, window, performance, Event, URLSearchParams, location */

const output = document.querySelector('#result');
const failures = [];
const source = 'flowchart LR\n  A[Browser CSP] --> B[Rendered SVG]';
let changeCount = 0;

window.addEventListener('securitypolicyviolation', (event) => {
  failures.push(`${event.violatedDirective}: ${event.blockedURI}`);
});

void (async () => {
try {
  const editor = window.MermaidVisualEditor.createMermaidVisualEditor(
    document.querySelector('#editor'),
    {
      value: source,
      onChange() { changeCount += 1; },
    },
  );

  const status = document.querySelector('.mve-status');
  const waitFor = (predicate) => new Promise((resolve, reject) => {
    const started = performance.now();
    const timer = window.setInterval(() => {
      try {
        if (predicate()) {
          window.clearInterval(timer);
          resolve(true);
        } else if (performance.now() - started > 10000) {
          window.clearInterval(timer);
          resolve(false);
        }
      } catch (error) {
        window.clearInterval(timer);
        reject(error);
      }
    }, 50);
  });
  const initialRenderSettled = await waitFor(() => status.dataset.state === 'ready' || status.dataset.state === 'error');
  const initialRenderReady = initialRenderSettled && status.dataset.state === 'ready';
  const initialValueMatches = editor.getValue() === source;

  const svgRendered = Boolean(document.querySelector('#editor svg'));
  const editedSource = `${source}\n  B --> C[Changed]`;
  const textarea = document.querySelector('#editor .mve-source');
  textarea.value = editedSource;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  const sourceEditApplied = await waitFor(() => editor.getValue() === editedSource && status.dataset.state === 'ready');
  const sourceChangeCallbackFired = changeCount > 0;
  const callbackCountBeforeSetValue = changeCount;
  editor.setValue(source);
  const setValueSynced = await waitFor(() => editor.getValue() === source && status.dataset.state === 'ready');
  const setValueDidNotEcho = changeCount === callbackCountBeforeSetValue;
  const result = {
    mode: new URLSearchParams(location.search).get('mode') ?? 'strict',
    initialRenderReady,
    svgRendered,
    initialValueMatches,
    sourceEditApplied,
    sourceChangeCallbackFired,
    setValueSynced,
    setValueDidNotEcho,
    status: status.textContent,
    cspViolations: failures,
  };
  window.__cspValidationResult = result;
  output.textContent = JSON.stringify(result, null, 2);
  output.dataset.result = Object.entries(result).every(([key, value]) => {
    if (['mode', 'status', 'cspViolations'].includes(key)) return true;
    return value === true;
  }) && failures.length === 0 ? 'pass' : 'fail';
  editor.destroy();
} catch (error) {
  const result = {
    mode: new URLSearchParams(location.search).get('mode') ?? 'strict',
    error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    cspViolations: failures,
  };
  window.__cspValidationResult = result;
  output.textContent = JSON.stringify(result, null, 2);
  output.dataset.result = 'fail';
}
})();
