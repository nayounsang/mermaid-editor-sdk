import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@mermaid-editor-sdk/headless': fileURLToPath(new URL('../headless/src/index.ts', import.meta.url)),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/legacy.ts',
      name: 'MermaidVisualEditor',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => format === 'es' ? 'legacy.js' : format === 'cjs' ? 'legacy.cjs' : 'mermaid-visual-editor.iife.js',
      cssFileName: 'style',
    },
    sourcemap: 'hidden',
  },
});
