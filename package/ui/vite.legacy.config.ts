import { defineConfig } from 'vite';

export default defineConfig({
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
