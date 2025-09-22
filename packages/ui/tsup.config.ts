import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/core/index.ts",
    "src/primitives/index.ts",
    "src/layout/index.ts",
    "src/navigation/index.ts",
    "src/data/index.ts",
    "src/forms/index.ts",
    "src/feedback/index.ts",
    "src/overlay/index.ts",
    "src/interaction/index.ts",
    "src/business/index.ts",
    "src/collaboration/index.ts",
    "src/accessibility/index.ts",
    "src/media/index.ts",
    "src/density/index.ts",
    "src/undo-redo/index.ts",
    "src/icons/index.ts",
    "src/wrappers/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: false, // Temporarily disable DTS generation
  clean: true,
  treeshake: true,
  splitting: true,
  external: ["react", "react-dom"],
  outDir: "dist",
  sourcemap: true,
  minify: false, // Keep readable for development
  target: "es2020",
  platform: "neutral",
});
