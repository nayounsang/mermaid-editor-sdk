import { describe, expect, it } from 'vitest';
import { getDiagramAdapter } from './adapter';
import { erAdapter } from './er-adapter';
import { ganttAdapter } from './gantt-adapter';
import { pieAdapter } from './pie-adapter';
import { registerBuiltInAdapters } from './register-built-in-adapters';

describe('built-in diagram adapters', () => {
  it('registers the ER adapter for runtime rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('er')).toBe(erAdapter);
  });

  it('registers the Gantt adapter for runtime rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('gantt')).toBe(ganttAdapter);
  });

  it('registers the Pie adapter for runtime rendering', () => {
    registerBuiltInAdapters();
    expect(getDiagramAdapter('pie')).toBe(pieAdapter);
  });
});
