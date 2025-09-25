# 🚨 SUPER IMPORTANT: Package Configuration Standard

## ⚠️ CRITICAL INSIGHT: Always Follow Working Package Patterns

**NEVER create manual configurations or deviate from proven working patterns. Always copy and align with existing successful packages.**

## 📋 Standard Package Configuration Checklist

### 1. TypeScript Configuration (`tsconfig.json`)
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "composite": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

**❌ NEVER ADD:**
- `rootDir` or `outDir` in main tsconfig.json
- `include: ["src/**/*"]` (too broad)
- Custom compiler options not in working packages

### 2. TypeScript Types Configuration (`tsconfig.types.json`)
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "emitDeclarationOnly": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist/types",
    "stripInternal": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["**/*.test.*", "**/*.stories.*", "**/__tests__/**"]
}
```

### 3. Package.json Build Scripts
```json
{
  "main": "dist/index.js",
  "types": "dist/types/src/index.d.ts",
  "scripts": {
    "build:types": "tsc -p tsconfig.types.json",
    "build:js": "tsup",
    "build": "pnpm run build:types && pnpm run build:js",
    "test": "vitest run",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  }
}
```

### 4. TSUP Configuration (`tsup.config.ts`)
```typescript
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
  // Add external for React packages:
  // external: ['react', 'react-dom'],
});
```

## 🎯 Reference Working Packages

**ALWAYS COPY FROM THESE PROVEN WORKING PACKAGES:**
- `packages/ui/` - React components package
- `packages/utils/` - Utility functions package
- `packages/contracts/` - Shared contracts package

## 🚫 Common Mistakes to AVOID

1. **❌ Manual TypeScript declarations** - Always use `tsconfig.types.json`
2. **❌ Different include patterns** - Always use `["src/**/*.ts", "src/**/*.tsx"]`
3. **❌ Custom build scripts** - Always use the standard pattern
4. **❌ Different tsup settings** - Always match working packages
5. **❌ Wrong types path** - Always use `dist/types/src/index.d.ts`

## ✅ Validation Checklist

Before creating any new package, verify:

- [ ] `tsconfig.json` matches working pattern exactly
- [ ] `tsconfig.types.json` exists and matches pattern
- [ ] `package.json` has correct build scripts
- [ ] `package.json` has correct types path
- [ ] `tsup.config.ts` matches working pattern
- [ ] All configurations are copied from working packages

## 🔄 When Adding New Packages

1. **Copy entire configuration from working package**
2. **Only modify package name and dependencies**
3. **Never deviate from proven patterns**
4. **Test build immediately after creation**

---

**🚨 REMEMBER: Consistency is more important than optimization. Follow the working pattern exactly.**
