import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // We generate types separately
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: 'node18',
  outDir: 'dist',
});
