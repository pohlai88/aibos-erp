import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Always false - types generated separately
  splitting: false,
  sourcemap: true,
  clean: false, // Always false - matches working packages
  treeshake: true,
  skipNodeModulesBundle: true,
  minify: false,
  target: 'es2022',
  external: ['react', 'react-dom'],
});
