import { vi } from 'vitest';

vi.stubGlobal('ResizeObserver', class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
});
