import { describe, expect, it } from 'vitest';
import mermaid from 'mermaid';
import { appendPaletteEntry, diagramTypeFromSource, paletteCatalog, templates } from './diagram-catalog';

describe('source-only palette catalog', () => {
  it('uses the baseline Quadrant data point snippet in its fallback catalog', () => {
    expect(paletteCatalog.quadrant?.find(({ label }) => label === 'Data point')?.snippet).toBe('    Label: [0.5, 0.5]');
  });

  it('identifies the current diagram and preserves its line endings', async () => {
    const source = 'gitGraph\r\n    commit\r\n    branch feature\r\n';
    expect(diagramTypeFromSource(source)).toBe('gitgraph');
    const branch = paletteCatalog.gitgraph!.find((entry) => entry.label === 'Branch')!;
    const next = appendPaletteEntry(source, 'gitgraph', branch);
    expect(next).toContain('branch feature2');
    expect(next.replace(/\r\n/g, '')).not.toContain('\n');
    mermaid.initialize({ startOnLoad: false });
    await expect(mermaid.parse(next)).resolves.toBeTruthy();
  });

  it('keeps every single palette insertion parseable', async () => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    const failures: string[] = [];
    for (const [type, entries] of Object.entries(paletteCatalog)) {
      for (const entry of entries ?? []) {
        const next = appendPaletteEntry(templates[type as keyof typeof templates], type as keyof typeof templates, entry);
        try { await mermaid.parse(next); }
        catch (error) { failures.push(`${type}: ${entry.label}: ${error instanceof Error ? error.message : String(error)}`); }
        const repeated = appendPaletteEntry(next, type as keyof typeof templates, entry);
        try { await mermaid.parse(repeated); }
        catch (error) { failures.push(`${type}: ${entry.label} twice: ${error instanceof Error ? error.message : String(error)}`); }
      }
    }
    expect(failures).toEqual([]);
  });
});
