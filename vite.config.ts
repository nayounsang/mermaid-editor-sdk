import { defineConfig } from 'vite';
import packageJson from './package.json';

const runtimePackages = Object.keys(packageJson.dependencies ?? {}).filter((name) => name !== 'nanoid');

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => format === 'cjs' ? 'index.cjs' : 'index.js',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: (id) => id === 'react' || id === 'react/jsx-runtime'
        || runtimePackages.some((name) => id === name || id.startsWith(`${name}/`)),
    },
    sourcemap: 'hidden',
  },
});
