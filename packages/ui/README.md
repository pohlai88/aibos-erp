# @aibos/ui

**Enterprise-grade React design system with hybrid optimization & anti-drift protection**

A comprehensive, type-safe design system built for the AIBOS ERP platform. Features semantic tokens, hybrid optimizations, tree-shaking guarantees, deterministic builds, and **beautiful interactive HTML documentation**.

## ⚡ Quick Commands

```bash
# Generate beautiful HTML docs (auto-opens in browser)
pnpm generate:docs

# Comprehensive validation (UI + general dependencies in one report)
pnpm validate:comprehensive

# Quick validation (same as comprehensive)
pnpm validate:all

# Quick open existing documentation
pnpm open:docs
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Generate & view beautiful HTML documentation
pnpm generate:docs
```

## 📦 Usage

### Basic Import

```tsx
import { Button, Card, Badge, tokens, generateCSSVars } from '@aibos/ui';

function MyComponent() {
  return (
    <Card>
      <Button variant="primary" size="md">
        Click me
      </Button>
      <Badge variant="success">Active</Badge>
    </Card>
  );
}
```

### Tree-Shaking Optimized Imports

```tsx
// Import specific components for optimal tree-shaking
import { Button } from '@aibos/ui/primitives/button';
import { Card } from '@aibos/ui/components/card';
import { tokens, colors, spacing, typography } from '@aibos/ui/tokens';
import { cn, variants, useComposedRefs } from '@aibos/ui/utils';
```

### CSS Variable Generation

```tsx
import { generateCSSVars, criticalTokens } from '@aibos/ui/tokens';

// Generate CSS variables for theming
const lightTheme = generateCSSVars('light');
const darkTheme = generateCSSVars('dark');

// Use critical tokens for above-the-fold performance
const criticalStyles = criticalTokens;
```

## 🏗️ Architecture

```
src/
├── tokens/           # Design tokens with hybrid optimizations
│   ├── index.ts      # Core tokens + tree-shaking exports
│   └── types.ts      # TypeScript definitions
├── primitives/       # Atomic components (Button, Input, Badge)
├── components/       # Molecular components (Card, Modal, Table)
├── hooks/            # Custom hooks (useTheme, useMediaQuery)
├── utils/            # Utilities with hybrid enhancements
│   ├── index.ts      # cn, variants, refs, polymorphic helpers
│   └── types.ts      # Utility type definitions
└── index.ts          # Main exports with tree-shaking
```

## 🎨 Design Tokens (Hybrid Optimized)

### Core Token System

```tsx
import { tokens, tokenResolver, tokenContracts } from '@aibos/ui/tokens';

// Access tokens with full type safety
const primaryColor = tokens.colors.primary[500];
const spacing = tokens.spacing[4];
const fontSize = tokens.typography.fontSize.lg;

// Use token resolver for dynamic access
const dynamicColor = tokenResolver.getValue('colors.primary.500');
const cssVar = tokenResolver.toCSSVar('colors.primary.500'); // --aibos-colors-primary-500

// Validate design contracts
const contrastResult = tokenContracts.contrast.validate('#ffffff', '#000000');
```

### Tree-Shaking Exports

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
```

### Brand Identity & Aliases

```tsx
import { tokens } from '@aibos/ui/tokens';

// Brand identity tokens
const brandName = tokens.brand.name; // "AIBOS"
const accentFamily = tokens.brand.accentFamily; // "blue"

// Alias references for zero-duplication
const accentColor = tokenResolver.getValue(tokens.aliasRefs.accent);
const successColor = tokenResolver.getValue(tokens.aliasRefs.success);
```

## 🛠️ Enhanced Utilities

### Class Name Utility

```tsx
import { cn } from '@aibos/ui/utils';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  'another-class'
);
```

### Variant System (Enhanced)

```tsx
import { variants } from '@aibos/ui/utils';

const buttonVariants = variants({
  base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  variants: {
    variant: {
      primary: 'bg-semantic-primary text-white hover:bg-semantic-primary/90',
      secondary: 'bg-semantic-secondary text-foreground hover:bg-semantic-secondary/80',
      destructive: 'bg-semantic-destructive text-white hover:bg-semantic-destructive/90',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
  strict: true, // Enable dev-time warnings for unknown variants
});

// Usage
const classes = buttonVariants({ variant: 'primary', size: 'lg' });
```

### Ref Composition (Enhanced)

```tsx
import { composeReferences, useComposedRefs } from '@aibos/ui/utils';

// Function-based ref composition
const refCallback = composeReferences(ref1, ref2, ref3);

// Hook-based ref composition (memoized)
function MyComponent() {
  const composedRef = useComposedRefs(ref1, ref2, ref3);
  return <div ref={composedRef} />;
}
```

### Polymorphic Components

```tsx
import { createPolymorphic } from '@aibos/ui/utils';

const Button = createPolymorphic<'button'>(
  ({ as: Component = 'button', children, ...props }, ref) => (
    <Component ref={ref} {...props}>
      {children}
    </Component>
  ),
  'Button'
);

// Usage with different element types
<Button>Default Button</Button>
<Button as="a" href="/link">Link Button</Button>
<Button as="div" role="button">Div Button</Button>
```

## 🎨 Theming & CSS Variables

### CSS Variable Generation

```tsx
import { generateCSSVars } from '@aibos/ui/tokens';

// Generate CSS for light theme
const lightCSS = generateCSSVars('light');
// Output: :root, [data-theme="light"] { --aibos-background-base: #ffffff; ... }

// Generate CSS for dark theme
const darkCSS = generateCSSVars('dark');
// Output: :root, [data-theme="dark"] { --aibos-background-base: #000000; ... }
```

### Theme Integration

```css
/* In your global CSS */
:root {
  /* Light theme variables */
  --aibos-background-base: #ffffff;
  --aibos-text-primary: #000000;
  --aibos-primary: 220 14% 96%;
  --aibos-primary-foreground: 220 9% 46%;
}

[data-theme="dark"] {
  /* Dark theme variables */
  --aibos-background-base: #000000;
  --aibos-text-primary: #ffffff;
  --aibos-primary: 220 9% 46%;
  --aibos-primary-foreground: 220 14% 96%;
}
```

## 🧩 Available Components

### Primitives (Atoms)

#### Button (Enhanced)

```tsx
import { Button } from '@aibos/ui/primitives/button';

<Button 
  variant="primary" 
  size="md" 
  disabled={false}
  as="button" // Polymorphic support
>
  Click me
</Button>
```

**Props:**
- `variant`: `"primary" | "secondary" | "ghost" | "destructive"`
- `size`: `"sm" | "md" | "lg"`
- `disabled`: `boolean`
- `as`: `ElementType` (polymorphic)

#### Input (Enhanced)

```tsx
import { Input } from '@aibos/ui/primitives/input';

<Input 
  variant="default" 
  size="md" 
  placeholder="Enter text..."
  value={value}
  onChange={handleChange}
/>
```

**Props:**
- `variant`: `"default" | "error"`
- `size`: `"sm" | "md" | "lg"`
- `placeholder`: `string`
- `value`: `string`
- `onChange`: `(event: ChangeEvent<HTMLInputElement>) => void`

#### Badge (Enhanced)

```tsx
import { Badge } from '@aibos/ui/primitives/badge';

<Badge variant="success" size="md">
  Active
</Badge>
```

**Props:**
- `variant`: `"default" | "secondary" | "destructive" | "outline" | "primary"`
- `size`: `"sm" | "md"`

### Components (Molecules)

#### Card (Enhanced)

```tsx
import { Card } from '@aibos/ui/components/card';

<Card variant="default" padding="md">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</Card>
```

**Props:**
- `variant`: `"default" | "elevated" | "outlined"`
- `padding`: `"sm" | "md" | "lg"`

#### VirtualTable (Enterprise-Ready)

```tsx
import { VirtualTable } from '@aibos/ui/components/virtual-table';

<VirtualTable
  data={data}
  columns={columns}
  height={400}
  itemHeight={50}
  className="bg-semantic-background" // Semantic classes
/>
```

## 🛡️ Anti-Drift Protection

### ESLint Rule

Prevents hardcoded Tailwind colors:

```json
// .eslintrc.json
{
  "plugins": ["aibos-ui"],
  "rules": {
    "aibos-ui/no-hardcoded-palette": "error"
  }
}
```

### Semantic Classes

Use semantic classes instead of hardcoded colors:

```tsx
// ❌ Bad - hardcoded colors
<div className="bg-blue-600 text-white" />

// ✅ Good - semantic tokens
<div className="bg-semantic-primary text-white" />
```

### Tailwind Configuration (Hybrid Optimized)

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
};
```

## 🔧 Development

### Project Structure

```
packages/ui/
├── src/                    # Source code
│   ├── primitives/        # Atomic components
│   ├── components/        # Molecular components
│   ├── hooks/            # Custom hooks
│   ├── tokens/           # Design tokens (hybrid optimized)
│   └── utils/            # Utilities (hybrid enhanced)
├── eslint-plugin/        # Anti-drift ESLint plugin
├── scripts/              # Build and migration scripts
├── dist/                 # Built output
└── package.json         # Package configuration
```

### Build Process

1. **Type Generation**: `tsc -p tsconfig.types.json`
2. **JavaScript Build**: `tsup` (ESM + CJS)
3. **Quality Gates**: Type checking, linting, size limits
4. **Tree-shaking**: Individual exports for optimal bundling

### Adding New Components

1. **Create component** in appropriate folder (`primitives/` or `components/`)
2. **Use semantic tokens** only (no hardcoded colors)
3. **Follow variant pattern** using the enhanced `variants` utility
4. **Add polymorphic support** with `createPolymorphic`
5. **Export from index.ts** with tree-shaking support
6. **Add comprehensive tests**

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

## 📊 Bundle Analysis

```bash
# Check bundle size
pnpm size

# Analyze bundle composition
pnpm build && npx bundle-analyzer dist/index.js
```

**Size Limits:**
- ESM: 50 KB
- CJS: 50 KB
- Critical Tokens: < 2 KB

## 🎨 Interactive HTML Documentation

### Beautiful Visual Documentation System

The AIBOS UI ecosystem includes a comprehensive HTML documentation system that automatically generates beautiful, interactive visualizations of your UI architecture.

#### **Generate & View Documentation**

```bash
# Generate HTML docs + auto-open in browser
pnpm generate:docs

# Quick open existing documentation
pnpm open:docs

# Generate SVG graphs (alternative)
pnpm generate:graphs
```

#### **UI Validation Commands**

```bash
# Comprehensive validation - UI + general dependencies in one beautiful report
pnpm validate:comprehensive

# Quick validation (same as comprehensive)
pnpm validate:all

# General dependencies only (Next.js, app-level issues)
pnpm check:ui-dependencies
```

**Why this approach?**
- **`validate:comprehensive`**: Shows both UI ecosystem AND general dependency issues in one structured report
- **`validate:all`**: Same as comprehensive - one command for everything
- **`check:ui-dependencies`**: Only checks general dependency violations (Next.js, app-level)
- **Clear separation**: UI issues vs general dependency issues are clearly distinguished

#### **What You Get**

- **📊 Dependency Graph**: Visual ecosystem structure with clean layer boundaries
- **🔍 Detailed Analysis**: Current state with issues highlighted and categorized
- **🚨 Violation Analysis**: Breakdown of all violations with priority levels and fix steps
- **📈 Status Report**: Project achievements, current issues, and next steps
- **🏠 Interactive Dashboard**: Professional navigation between all sections

#### **Features**

- **🎨 Professional Design**: Modern UI with gradients, responsive design, hover effects
- **📱 Cross-Platform**: Works on Windows, macOS, Linux - auto-detects your platform
- **🌐 Auto-Opening**: Automatically opens in your default browser
- **📊 Interactive Graphs**: Embedded Mermaid graphs that render in the browser
- **🧭 Navigation**: Easy movement between all documentation pages
- **⚡ Fast Generation**: Creates comprehensive docs in seconds

#### **Documentation Structure**

```
docs/ui-ecosystem/
├── index.html              # Main dashboard with overview
├── dependency-graph.html   # Overall ecosystem structure
├── detailed-analysis.html   # Current state with issues
├── violation-analysis.html  # Violation breakdown and fixes
└── status-report.html       # Project status summary
```

#### **Example Output**

When you run `pnpm generate:docs`, you get:

1. **Beautiful Dashboard** opens automatically in your browser
2. **Interactive Mermaid Graphs** showing your UI ecosystem
3. **Professional Styling** with gradients and modern design
4. **Cross-page Navigation** between all sections
5. **Real-time Analysis** of your current architecture

#### **Why This is Amazing**

- **🚀 Instant Visual Feedback**: See your architecture at a glance
- **🎯 Issue Identification**: Quickly spot problems and priorities
- **📈 Progress Tracking**: Visual representation of improvements
- **👥 Team Communication**: Share beautiful docs with stakeholders
- **🔧 Developer Experience**: Professional tooling that feels enterprise-grade

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## 📋 Quality Gates

- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Bundle Size**: Under 50KB limit
- ✅ **Tree-shaking**: Individual exports optimized
- ✅ **Critical Path**: < 2KB for above-the-fold
- ✅ **Linting**: ESLint with custom anti-drift rules
- ✅ **Testing**: Vitest + Testing Library (53 tests passing)
- ✅ **Build**: Deterministic, reproducible builds
- ✅ **Hybrid Optimization**: Enterprise-grade performance
- ✅ **Visual Documentation**: Interactive HTML docs with Mermaid graphs
- ✅ **Dependency Validation**: Enhanced cruiser with UI ecosystem rules

## 🚀 Hybrid Optimization Features

### Tree-Shaking Guarantees
- Individual exports for optimal bundling
- Critical path optimization (< 2KB)
- Zero-runtime CSS generation

### Enhanced Developer Experience
- Strict variant warnings in development
- Memoized ref composition
- Polymorphic component support
- Comprehensive type safety
- Interactive HTML documentation with auto-opening
- Visual dependency analysis with Mermaid graphs

### Enterprise-Ready
- Mobile-first hover behavior
- Monorepo-aware content paths
- Enhanced safelist patterns
- Headless UI variant support

## 🤝 Contributing

1. **Follow established patterns** - Use existing components as templates
2. **Use semantic tokens only** - No hardcoded colors
3. **Add comprehensive tests** - Cover all variants and edge cases
4. **Update documentation** - Keep README and examples current
5. **Ensure bundle size limits** - Monitor impact on bundle size
6. **Use hybrid optimizations** - Leverage tree-shaking and critical path features
7. **Validate architecture** - Run `pnpm validate:all` to check layer boundaries
8. **Generate visual docs** - Use `pnpm generate:docs` to create beautiful documentation

## 📄 License

MIT License - see LICENSE file for details.

---

**Need help?** Check the [Developer Guide](./DEVELOPER_GUIDE.md) or create an issue in the repository.