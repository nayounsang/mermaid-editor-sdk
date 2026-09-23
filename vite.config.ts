import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'MermaidVisualEditor',
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => {
        if (format === 'cjs') return 'index.cjs';
        if (format === 'iife') return 'mermaid-visual-editor.iife.js';
        return 'index.js';
      },
      cssFileName: 'style',
    },
    sourcemap: 'hidden',
  },
});
