import { describe, expect, it } from 'vitest';
import { getDiagramAdapter } from './adapter';
import { erAdapter } from './er-adapter';
import { registerBuiltInAdapters } from './register-built-in-adapters';

describe('built-in diagram adapters', () => {
  it('registers the ER adapter for runtime rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('er')).toBe(erAdapter);
  });
});
