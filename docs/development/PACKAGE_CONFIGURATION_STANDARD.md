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

## 🚨 Next.js App Configuration Standards

### Critical Configuration Rules for Next.js Apps

#### 1. transpilePackages Configuration

**❌ NEVER DO THIS:**

```json
// apps/web/package.json - LEGACY FORMAT (REMOVE)
{
  "next": {
    "transpilePackages": ["@aibos/ui", "@aibos/accounting-web"]
  }
}
```

**✅ ALWAYS DO THIS:**

```javascript
// apps/web/next.config.js - MODERN FORMAT (ONLY)
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@aibos/accounting',
    '@aibos/accounting-contracts',
    '@aibos/accounting-web',
    '@aibos/contracts',
    '@aibos/ui',
    '@aibos/utils',
  ],
};

export default nextConfig;
```

#### 2. Package Export Standards

**❌ NEVER DO THIS:**

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs", // File doesn't exist!
      "require": "./dist/index.cjs"
    }
  },
  "module": "./dist/index.mjs" // File doesn't exist!
}
```

**✅ ALWAYS DO THIS:**

```json
{
  "exports": {
    ".": {
      "types": "./dist/types/src/index.d.ts",
      "import": "./dist/index.js", // Actual file
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js", // Actual file
  "types": "./dist/types/src/index.d.ts"
}
```

#### 3. Dependency Version Consistency

**❌ NEVER DO THIS:**

```json
{
  "dependencies": {
    "@tanstack/react-query": "5.0.0",
    "@tanstack/react-query-devtools": "^5.90.2" // Version mismatch!
  }
}
```

**✅ ALWAYS DO THIS:**

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.90.2",
    "@tanstack/react-query-devtools": "^5.90.2" // Consistent versions
  }
}
```

#### 4. TypeScript Configuration for Next.js Apps

**❌ NEVER DO THIS:**

```json
{
  "extends": "../../tsconfig.json" // Wrong base config
}
```

**✅ ALWAYS DO THIS:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./.next",
    "composite": false,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "declaration": false,
    "emitDeclarationOnly": false,
    "noEmit": true,
    "target": "ES2017",
    "strict": false,
    "module": "esnext",
    "moduleResolution": "bundler", // Next.js specific
    "isolatedModules": true,
    "experimentalDecorators": false, // Override base config
    "emitDecoratorMetadata": false,
    "useDefineForClassFields": true
  }
}
```

#### 5. Complete Dependency Requirements

**❌ NEVER DO THIS:**

```json
{
  "dependencies": {
    "@aibos/accounting-web": "workspace:*"
    // Missing @aibos/accounting dependency!
  }
}
```

**✅ ALWAYS DO THIS:**

```json
{
  "dependencies": {
    "@aibos/accounting": "workspace:*", // Required by accounting-web
    "@aibos/accounting-contracts": "workspace:*", // Required by accounting-web
    "@aibos/accounting-web": "workspace:*",
    "@aibos/contracts": "workspace:*",
    "@aibos/ui": "workspace:*",
    "@aibos/utils": "workspace:*"
  }
}
```

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
