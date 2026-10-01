import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RendererModel } from '@mermaid-editor-sdk/headless';
import { MermaidCanvas } from './MermaidCanvas';

const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');

vi.mock('../../renderer/mermaid-renderer', () => ({
  MermaidRendererError: class MermaidRendererError extends Error {},
  renderMermaid: vi.fn(async () => ({
    svg: '<svg viewBox="0 0 400 200"><rect width="400" height="200" /></svg>',
    bindFunctions: () => undefined,
  })),
}));

describe('MermaidCanvas', () => {
  afterEach(() => {
    if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fits the diagram to the updated canvas size when the canvas resizes', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let width = 232;
    let resize: ResizeObserverCallback | undefined;
    let observedElement: Element | undefined;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { resize = callback; }
      observe(target: Element): void { observedElement = target; }
      unobserve(): void {}
      disconnect(): void {}
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('mve-preview-stage') ? width : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('mve-preview-stage') ? 232 : 0;
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: vi.fn(),
    });

    await act(async () => {
      root.render(
        <MermaidCanvas
          source="flowchart LR\n  A --> B"
          model={{ diagramType: 'unknown' } as RendererModel}
          onSelection={() => undefined}
          onRenderState={() => undefined}
          onSourceMutation={() => false}
          sourceRevision={0}
          onParseResult={() => undefined}
          onReset={() => undefined}
          onEditSelection={() => undefined}
          autoFit
        />,
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.querySelector('[aria-label="Zoom level"]')?.textContent).toBe('50%');
    expect(resize).toBeDefined();
    expect(observedElement).toBe(host.querySelector('.mve-preview-stage'));

    width = 432;
    if (!resize || !observedElement) throw new Error('The canvas resize observer was not registered.');
    const resizeCallback = resize;
    const target = observedElement;
    await act(async () => {
      resizeCallback([{
        target,
        contentRect: { width, height: 232 },
      } as ResizeObserverEntry], {} as ResizeObserver);
    });

    expect(host.querySelector('[aria-label="Zoom level"]')?.textContent).toBe('100%');

    await act(async () => root.unmount());
    host.remove();
  });
});
