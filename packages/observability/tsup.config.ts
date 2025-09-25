import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disable DTS - will create manually
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  skipNodeModulesBundle: true,
  minify: false,
  target: 'es2022',
});
