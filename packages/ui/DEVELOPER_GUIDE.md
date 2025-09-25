# AIBOS UI Developer Guide

**Complete guide for developers working with the AIBOS UI design system**

This guide covers everything you need to know to work effectively with the AIBOS UI design system, from basic usage to advanced hybrid optimization features.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Hybrid Optimization Features](#hybrid-optimization-features)
4. [Component Development](#component-development)
5. [Design Token System](#design-token-system)
6. [Anti-Drift System](#anti-drift-system)
7. [Testing Strategy](#testing-strategy)
8. [Build Process](#build-process)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18.0+
- pnpm 8.0.0+
- TypeScript 5.9.2+
- React 18.2.0+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd aibos-erp

# Install dependencies
pnpm install

# Build UI packages
pnpm build --filter=@aibos/ui
pnpm build --filter=@aibos/ui-business
```

### Quick Test

```bash
# Test the build
cd packages/ui
pnpm build
pnpm typecheck
pnpm test
```

## 🏗️ Architecture Overview

### Package Structure

```
packages/
├── ui/                    # Core design system (hybrid optimized)
│   ├── src/
│   │   ├── tokens/       # Design tokens with hybrid features
│   │   ├── primitives/   # Atomic components
│   │   ├── components/   # Molecular components
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilities with hybrid enhancements
│   ├── eslint-plugin/    # Anti-drift ESLint plugin
│   └── scripts/          # Build and migration tools
└── ui-business/          # Business-specific components
    └── src/
        └── cfo-dashboard/ # CFO Dashboard components
```

### Design System Layers

1. **Tokens Layer**: Colors, spacing, typography, shadows (hybrid optimized)
2. **Primitives Layer**: Basic UI elements (Button, Input, Badge)
3. **Components Layer**: Complex UI elements (Card, Modal, Table)
4. **Business Layer**: Domain-specific components (CFO Dashboard)

### Import Strategy (Tree-Shaking Optimized)

```tsx
// ✅ Recommended - Tree-shakable imports
import { Button, Card, tokens, generateCSSVars } from '@aibos/ui';

// ✅ Alternative - Individual exports for optimal tree-shaking
import { Button } from '@aibos/ui/primitives/button';
import { Card } from '@aibos/ui/components/card';
import { tokens, colors, spacing, typography } from '@aibos/ui/tokens';
import { cn, variants, useComposedRefs } from '@aibos/ui/utils';

// ✅ Critical path optimization
import { criticalTokens } from '@aibos/ui/tokens';

// ❌ Avoid - Importing from source files
import { Button } from '@aibos/ui/src/primitives/button';
```

## 🚀 Hybrid Optimization Features

### Tree-Shaking Guarantees

```tsx
// Individual exports for optimal bundling
import { colors, spacing, typography, shadows } from '@aibos/ui/tokens';

// These are direct references to token categories
console.log(colors.primary); // Same as tokens.colors.primary
console.log(spacing[4]);      // Same as tokens.spacing[4]
```

### Critical Path Optimization

```tsx
import { criticalTokens } from '@aibos/ui/tokens';

// Critical tokens for above-the-fold performance (< 2KB)
const criticalStyles = {
  colors: criticalTokens.colors,     // Primary + neutral only
  spacing: criticalTokens.spacing,   // 0, 1, 2, 4 only
  typography: criticalTokens.typography, // Base font only
};

// Runtime validation in dev only
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  const criticalSize = JSON.stringify(criticalTokens).length;
  if (criticalSize > 2048) {
    throw new Error(`Critical tokens exceed 2KB: ${criticalSize} bytes`);
  }
}
```

### Zero-Runtime CSS Generation

```tsx
import { generateCSSVars } from '@aibos/ui/tokens';

// Generate CSS variables for theming
const lightCSS = generateCSSVars('light');
const darkCSS = generateCSSVars('dark');

// Output example:
// :root, [data-theme="light"] {
//   --aibos-background-base: #ffffff;
//   --aibos-text-primary: #000000;
//   ...
// }
```

### Enhanced Utilities

```tsx
import { variants, useComposedRefs, createPolymorphic } from '@aibos/ui/utils';

// Enhanced variant system with strict mode
const buttonVariants = variants({
  base: 'base-classes',
  variants: {
    variant: { primary: 'primary-classes', secondary: 'secondary-classes' },
    size: { sm: 'small-classes', md: 'medium-classes' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
  strict: true, // Enable dev-time warnings for unknown variants
});

// Memoized ref composition
function MyComponent() {
  const composedRef = useComposedRefs(ref1, ref2, ref3);
  return <div ref={composedRef} />;
}

// Polymorphic components with enhanced typing
const Button = createPolymorphic<'button'>(
  ({ as: Component = 'button', children, ...props }, ref) => (
    <Component ref={ref} {...props}>
      {children}
    </Component>
  ),
  'Button'
);
```

## 🧩 Component Development

### Component Template (Enhanced)

```tsx
import type { ReactNode, HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn, variants, createPolymorphic } from '../utils';

export interface MyComponentProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

const myComponentVariants = variants({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  variants: {
    variant: {
      default: 'bg-semantic-secondary text-foreground hover:bg-semantic-secondary/80 focus:ring-semantic-secondary',
      primary: 'bg-semantic-primary text-white hover:bg-semantic-primary/90 focus:ring-semantic-primary',
      secondary: 'bg-semantic-secondary text-foreground hover:bg-semantic-secondary/80 focus:ring-semantic-secondary',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
  strict: true, // Enable dev-time warnings
});

export const MyComponent = createPolymorphic<'div'>(
  ({ as: Component = 'div', variant, size, className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(myComponentVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
  'MyComponent'
);
```

### Component Guidelines

#### 1. Use Semantic Tokens Only

```tsx
// ✅ Good - Semantic tokens
<div className="bg-semantic-primary text-white" />

// ❌ Bad - Hardcoded colors
<div className="bg-blue-600 text-white" />
```

#### 2. Follow Enhanced Variant Pattern

```tsx
// ✅ Good - Enhanced variant system with strict mode
const buttonVariants = variants({
  base: 'base-classes',
  variants: {
    variant: { primary: 'primary-classes', secondary: 'secondary-classes' },
    size: { sm: 'small-classes', md: 'medium-classes' },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
  strict: true, // Dev-time warnings for typos
});
```

#### 3. Use Polymorphic Components

```tsx
// ✅ Good - Polymorphic component with enhanced typing
<Button as="a" href="/link">Link Button</Button>

// ❌ Bad - Fixed element type
<button href="/link">Link Button</button> // Invalid HTML
```

#### 4. Proper TypeScript Types

```tsx
// ✅ Good - Proper interface extension with polymorphic support
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  as?: ElementType; // Polymorphic support
}

// ❌ Bad - Missing base attributes
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}
```

## 🎨 Design Token System

### Core Token Access

```tsx
import { tokens, tokenResolver, tokenContracts } from '@aibos/ui/tokens';

// Direct token access
const primaryColor = tokens.colors.primary[500];
const spacing = tokens.spacing[4];
const fontSize = tokens.typography.fontSize.lg;

// Dynamic token resolution
const dynamicColor = tokenResolver.getValue('colors.primary.500');
const cssVar = tokenResolver.toCSSVar('colors.primary.500'); // --aibos-colors-primary-500

// Design contract validation
const contrastResult = tokenContracts.contrast.validate('#ffffff', '#000000');
const spacingScale = tokenContracts.spacingScale; // '1.5rem'
```

### Brand Identity & Aliases

```tsx
import { tokens } from '@aibos/ui/tokens';

// Brand identity tokens
const brandName = tokens.brand.name; // "AIBOS"
const accentFamily = tokens.brand.accentFamily; // "blue"
const gradients = tokens.brand.gradients; // Brand gradient definitions

// Alias references for zero-duplication
const accentColor = tokenResolver.getValue(tokens.aliasRefs.accent);
const successColor = tokenResolver.getValue(tokens.aliasRefs.success);
const errorColor = tokenResolver.getValue(tokens.aliasRefs.error);
```

### Mode-Based Theming

```tsx
import { tokens } from '@aibos/ui/tokens';

// Light mode tokens
const lightBackground = tokens.modes.light.background.base;
const lightText = tokens.modes.light.text.primary;

// Dark mode tokens
const darkBackground = tokens.modes.dark.background.base;
const darkText = tokens.modes.dark.text.primary;
```

### Accessibility Tokens

```tsx
import { tokens } from '@aibos/ui/tokens';

// Accessibility thresholds
const minContrastAA = tokens.a11y.minContrastAA; // 4.5
const minContrastAAA = tokens.a11y.minContrastAAA; // 7

// Touch target sizing
const minTouchTarget = tokens.sizing.touchTarget.min; // '44px'
```

## 🛡️ Anti-Drift System

### ESLint Plugin

The anti-drift ESLint plugin prevents hardcoded colors:

```json
// .eslintrc.json
{
  "plugins": ["aibos-ui"],
  "rules": {
    "aibos-ui/no-hardcoded-palette": "error"
  }
}
```

### Enhanced Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  // Mobile-first hover behavior
  future: {
    hoverOnlyWhenSupported: true,
  },
  
  // Monorepo-aware content paths
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/**/*.{js,ts,jsx,tsx,mdx}',
    '../../apps/**/*.{js,ts,jsx,tsx,mdx}',
    'node_modules/@aibos/ui/dist/**/*.js',
  ],
  
  // Enhanced safelist for dynamic classes
  safelist: [
    {
      pattern: /^(text|bg|border|ring|ring-offset|outline|fill|stroke)-(primary|secondary|muted|accent|success|warning|info|destructive|error)(?:-(50|100|200|300|400|500|600|700|800|900))?$/,
    },
    {
      pattern: /^(bg|text|border|ring|ring-offset|outline|fill|stroke)-semantic-(primary|secondary|success|warning|error|info|muted|accent|foreground|background|card|popover)(?:-foreground)?$/,
    },
  ],
  
  plugins: [
    require('tailwindcss/plugin')(function({ addUtilities, addVariant }) {
      // Semantic utilities generation
      const bases = ['primary','secondary','success','warning','error','info','muted','accent','foreground','background','card','popover'];
      const attrs = ['bg','text','border','ring','ring-offset','from','via','to','outline','fill','stroke'];
      
      // Generate semantic utilities
      const utils = {};
      for (const b of bases) {
        const varBase = `hsl(var(--${b}))`;
        const varFg = `hsl(var(--${b}-foreground))`;
        
        for (const a of attrs) {
          const cls = `.${e(`${a}-semantic-${b}`)}`;
          if (a === 'bg') utils[cls] = { backgroundColor: varBase };
          else if (a === 'text') utils[cls] = { color: varBase };
          // ... other mappings
        }
      }
      
      addUtilities(utils);
      
      // Enterprise variants
      addVariant('hocus', ['&:hover', '&:focus-visible']);
      addVariant('aria-selected', '&[aria-selected="true"]');
      addVariant('data-state-open', '&[data-state="open"]');
      addVariant('data-state-closed', '&[data-state="closed"]');
      addVariant('data-state-checked', '&[data-state="checked"]');
      addVariant('data-state-unchecked', '&[data-state="unchecked"]');
    }),
  ],
};
```

## 🧪 Testing Strategy

### Unit Tests (Enhanced)

```tsx
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-semantic-primary');
  });

  it('handles disabled state', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('supports polymorphic rendering', () => {
    render(<Button as="a" href="/link">Link Button</Button>);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });
});
```

### Token Tests (Comprehensive)

```tsx
// tokens.spec.ts
import { describe, it, expect } from 'vitest';
import { tokens, tokenResolver, tokenContracts, generateCSSVars, criticalTokens } from '../src/tokens';

describe('Design Tokens SSOT', () => {
  it('provides tree-shaking guarantees with individual exports', () => {
    expect(colors).toBeDefined();
    expect(spacing).toBeDefined();
    expect(typography).toBeDefined();
    expect(colors).toBe(tokens.colors);
    expect(spacing).toBe(tokens.spacing);
    expect(typography).toBe(tokens.typography);
  });

  it('generates zero-runtime CSS variables', () => {
    const lightCSS = generateCSSVars('light');
    const darkCSS = generateCSSVars('dark');
    
    expect(lightCSS).toContain(':root, [data-theme="light"]');
    expect(darkCSS).toContain(':root, [data-theme="dark"]');
    expect(lightCSS).toContain('--aibos-background-base:');
    expect(darkCSS).toContain('--aibos-background-base:');
  });

  it('provides critical tokens for above-the-fold performance', () => {
    expect(criticalTokens.colors).toBeDefined();
    expect(criticalTokens.spacing).toBeDefined();
    expect(criticalTokens.typography).toBeDefined();
    
    const criticalSize = JSON.stringify(criticalTokens).length;
    expect(criticalSize).toBeLessThan(2048); // Should be under 2KB
  });
});
```

### Utility Tests (Enhanced)

```tsx
// utils.test.ts
import { describe, it, expect, vi } from 'vitest';
import { composeReferences, variants } from '../src/utils';

describe('composeReferences', () => {
  it('updates function and object refs and clears with null', () => {
    const fn = vi.fn<(node: HTMLDivElement | null) => void>();
    const obj = { current: null as HTMLDivElement | null };
    const cb = composeReferences<HTMLDivElement>(fn, obj);
    const node = {} as HTMLDivElement;
    
    cb(node);
    expect(fn).toHaveBeenCalledWith(node);
    expect(obj.current).toBe(node);
    
    cb(null);
    expect(fn).toHaveBeenCalledWith(null);
    expect(obj.current).toBeNull();
  });
});

describe('variants', () => {
  const button = variants({
    base: 'base',
    variants: {
      size: { sm: 'sm', md: 'md' },
      tone: { primary: 'p', secondary: 's' },
    },
    defaultVariants: { size: 'md' },
    strict: false, // Disable strict mode for tests
  });

  it('merges base and defaults and props', () => {
    const cls = button({ tone: 'primary' });
    expect(cls).toContain('base');
    expect(cls).toContain('md');
    expect(cls).toContain('p');
  });

  it('handles unknown values gracefully', () => {
    const cls = button({ size: 'xl' as any });
    expect(cls).toContain('base');
    expect(cls).toContain('md'); // Should use default
  });
});
```

## 🔧 Build Process

### Build Steps

1. **Type Generation**: `tsc -p tsconfig.types.json`
2. **JavaScript Build**: `tsup` (ESM + CJS)
3. **Quality Gates**: Type checking, linting, size limits
4. **Tree-shaking**: Individual exports for optimal bundling

### Build Commands

```bash
# Build types only
pnpm build:types

# Build JavaScript only
pnpm build:js

# Build everything
pnpm build

# Development build with watch
pnpm dev
```

### Bundle Analysis

```bash
# Check bundle size
pnpm size

# Analyze bundle composition
pnpm build && npx bundle-analyzer dist/index.js
```

### Size Limits

- **ESM**: 50 KB
- **CJS**: 50 KB
- **Critical Tokens**: < 2 KB

## ⚡ Performance Optimization

### Tree-Shaking Strategy

```tsx
// ✅ Optimal - Individual imports
import { colors, spacing } from '@aibos/ui/tokens';
import { Button } from '@aibos/ui/primitives/button';

// ✅ Good - Main import (still tree-shakable)
import { Button, colors } from '@aibos/ui';

// ❌ Avoid - Importing everything
import * as UI from '@aibos/ui';
```

### Critical Path Optimization

```tsx
// Use critical tokens for above-the-fold content
import { criticalTokens } from '@aibos/ui/tokens';

const CriticalStyles = () => (
  <style>
    {`
      .critical-bg { background-color: ${criticalTokens.colors.primary[500]}; }
      .critical-text { color: ${criticalTokens.colors.neutral[900]}; }
      .critical-spacing { padding: ${criticalTokens.spacing[4]}; }
    `}
  </style>
);
```

### CSS Variable Generation

```tsx
// Generate CSS at build time (zero runtime cost)
import { generateCSSVars } from '@aibos/ui/tokens';

// In your build process
const lightThemeCSS = generateCSSVars('light');
const darkThemeCSS = generateCSSVars('dark');

// Write to CSS files
fs.writeFileSync('themes/light.css', lightThemeCSS);
fs.writeFileSync('themes/dark.css', darkThemeCSS);
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Build Errors

```bash
# Check TypeScript errors
pnpm typecheck

# Check linting errors
pnpm lint

# Check for missing dependencies
pnpm install
```

#### 2. Import Errors

```tsx
// ❌ Bad - Importing from source
import { Button } from '@aibos/ui/src/primitives/button';

// ✅ Good - Importing from package
import { Button } from '@aibos/ui/primitives/button';
```

#### 3. Semantic Class Not Found

```bash
# Check if semantic plugin is enabled
grep -r "semantic" tailwind.config.js

# Check if classes are in safelist
grep -r "bg-semantic-primary" tailwind.config.js
```

#### 4. Tree-Shaking Issues

```bash
# Check individual exports
grep -r "export const colors" src/tokens/index.ts

# Verify bundle analysis
pnpm build && npx bundle-analyzer dist/index.js
```

#### 5. Critical Tokens Size Exceeded

```bash
# Check critical tokens size
node -e "console.log(JSON.stringify(require('./dist/tokens.js').criticalTokens).length)"
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* pnpm build

# Check build output
ls -la dist/

# Check type definitions
ls -la dist/types/
```

## 📋 Best Practices

### 1. Component Development

- **Use semantic tokens only** - No hardcoded colors
- **Follow enhanced variant pattern** - Consistent API with strict mode
- **Add polymorphic support** - Flexible element types
- **Add comprehensive tests** - Unit tests + Storybook stories
- **Document props** - Clear TypeScript interfaces
- **Handle edge cases** - Disabled states, loading states, etc.

### 2. Import Strategy

- **Prefer tree-shakable imports** - Import only what you need
- **Use individual exports** - For optimal bundle optimization
- **Use critical tokens** - For above-the-fold performance
- **Avoid source imports** - Always import from built packages

### 3. Testing

- **Test all variants** - Cover all component states
- **Test accessibility** - Keyboard navigation, screen readers
- **Test edge cases** - Empty states, error states, loading states
- **Test polymorphic behavior** - Different element types
- **Visual regression testing** - Use Storybook + Chromatic

### 4. Performance

- **Monitor bundle size** - Stay under size limits
- **Use tree-shaking** - Import only needed components
- **Use critical tokens** - For above-the-fold content
- **Generate CSS at build time** - Zero runtime cost
- **Lazy load components** - For large, rarely used components

### 5. Maintenance

- **Regular updates** - Keep dependencies current
- **Security audits** - Run `pnpm audit` regularly
- **Performance monitoring** - Track bundle size over time
- **Documentation updates** - Keep examples current
- **Hybrid optimization** - Leverage new features

## 🚀 Advanced Topics

### Custom Themes

```tsx
// Custom theme implementation
const customTheme = {
  colors: {
    semantic: {
      primary: 'hsl(var(--custom-primary))',
      secondary: 'hsl(var(--custom-secondary))',
    },
  },
};

// Generate CSS variables for custom theme
const customCSS = generateCSSVars('light', customTheme);
```

### Plugin Development

```tsx
// Custom Tailwind plugin
const customPlugin = require('tailwindcss/plugin')(function({ addUtilities, addVariant }) {
  const utilities = {
    '.custom-utility': {
      backgroundColor: 'hsl(var(--custom-color))',
    },
  };
  addUtilities(utilities);
  
  // Add custom variants
  addVariant('custom-state', '&[data-custom="true"]');
});
```

### Performance Optimization

```tsx
// Lazy loading components
const LazyComponent = lazy(() => import('./LazyComponent'));

// Memoization for expensive components
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);
  
  return <div>{processedData}</div>;
});

// Critical path optimization
const CriticalStyles = () => (
  <style>
    {`
      .above-fold { 
        background-color: ${criticalTokens.colors.primary[500]}; 
        color: ${criticalTokens.colors.neutral[900]}; 
      }
    `}
  </style>
);
```

## 📚 Additional Resources

- [AIBOS UI README](./README.md) - Basic usage guide
- [ESLint Plugin README](./eslint-plugin/README.md) - Anti-drift tooling
- [Codemods README](./scripts/codemods/README.md) - Migration tools
- [UI Business README](../ui-business/README.md) - Business components
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Styling framework
- [React Documentation](https://react.dev) - React framework

---

**Need help?** Create an issue in the repository or reach out to the development team.