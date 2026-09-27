import { defineConfig } from 'vite';
import packageJson from './package.json';

// p-queue v9 is ESM-only and cannot be loaded by the package's CommonJS
// entrypoint, so keep it in the bundle for both module formats.
const runtimePackages = Object.keys(packageJson.dependencies ?? {}).filter(
  (name) => name !== 'nanoid' && name !== 'p-queue',
);

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        provider: 'src/ui/context/index.ts',
        toolbar: 'src/ui/components/ToolSidebar.tsx',
        source: 'src/ui/components/SourceEditor.tsx',
        renderer: 'src/ui/components/MermaidCanvas.tsx',
        components: 'src/ui/components/index.ts',
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => entryName === 'index'
        ? (format === 'cjs' ? 'index.cjs' : 'index.js')
        : `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
      cssFileName: 'style',
    },
    rollupOptions: {
      external: (id) => id === 'react' || id === 'react/jsx-runtime'
        || runtimePackages.some((name) => id === name || id.startsWith(`${name}/`)),
    },
    sourcemap: 'hidden',
  },
});
