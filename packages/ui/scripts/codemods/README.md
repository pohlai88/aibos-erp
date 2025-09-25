# AIBOS UI Codemods

**Automated migration tools for AIBOS UI design system**

Codemods for migrating hardcoded Tailwind colors to semantic tokens and other design system updates.

## 🚀 Available Codemods

### replace-hardcoded-colors

Automatically replaces hardcoded Tailwind palette classes with semantic tokens.

## 📦 Usage

### Basic Usage

```bash
# Migrate hardcoded colors in apps and packages
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "apps/**/*" "packages/**/*"
```

### Specific Files

```bash
# Migrate specific files
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "src/components/**/*.tsx"
```

### Multiple Patterns

```bash
# Migrate multiple patterns
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "apps/**/*" "packages/**/*" "src/**/*.tsx"
```

## 🎯 What It Does

### Color Mapping

The codemod automatically maps hardcoded colors to semantic tokens:

| Color Family | Semantic Token | Examples |
|--------------|----------------|----------|
| `blue`, `indigo`, `violet`, `sky` | `primary` | `bg-blue-600` → `bg-semantic-primary` |
| `gray`, `slate`, `zinc`, `neutral`, `stone` | `secondary` | `text-gray-500` → `text-semantic-secondary` |
| `green`, `emerald`, `teal`, `lime` | `success` | `border-green-500` → `border-semantic-success` |
| `yellow`, `amber`, `orange` | `warning` | `ring-yellow-400` → `ring-semantic-warning` |
| `red`, `rose` | `error` | `bg-red-500` → `bg-semantic-error` |
| `cyan`, `fuchsia`, `purple`, `pink` | `info` | `text-cyan-600` → `text-semantic-info` |

### Supported Attributes

- `bg-{color}-{shade}` → `bg-semantic-{token}`
- `text-{color}-{shade}` → `text-semantic-{token}`
- `border-{color}-{shade}` → `border-semantic-{token}`
- `ring-{color}-{shade}` → `ring-semantic-{token}`
- `ring-offset-{color}-{shade}` → `ring-offset-semantic-{token}`

## 🔍 Examples

### Before Migration

```tsx
// Hardcoded colors
<div className="bg-blue-600 text-white border-gray-200">
  <button className="ring-emerald-300 bg-red-500">
    Click me
  </button>
</div>
```

### After Migration

```tsx
// Semantic tokens
<div className="bg-semantic-primary text-white border-semantic-secondary">
  <button className="ring-semantic-success bg-semantic-error">
    Click me
  </button>
</div>
```

## ⚙️ Configuration

### Custom Mapping

You can modify the color mapping in the codemod script:

```typescript
// packages/ui/scripts/codemods/replace-hardcoded-colors.ts
const TOKENS = {
  primary: ["blue", "indigo", "violet", "sky"],
  secondary: ["gray", "slate", "zinc", "neutral", "stone"],
  success: ["green", "emerald", "teal", "lime"],
  warning: ["yellow", "amber", "orange"],
  error: ["red", "rose"],
  info: ["cyan", "fuchsia", "purple", "pink"],
};
```

### Adding New Mappings

```typescript
// Add new color families
const TOKENS = {
  // ... existing mappings
  accent: ["purple", "pink", "fuchsia"],
  muted: ["gray", "slate"],
};
```

## 🚀 Migration Workflow

### 1. Backup Your Code

```bash
# Create a backup branch
git checkout -b backup-before-codemod
git add .
git commit -m "Backup before codemod migration"
```

### 2. Run the Codemod

```bash
# Run the migration
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "apps/**/*" "packages/**/*"
```

### 3. Review Changes

```bash
# Review the changes
git diff

# Check specific files
git diff src/components/MyComponent.tsx
```

### 4. Test Thoroughly

```bash
# Build the project
pnpm build

# Run tests
pnpm test

# Check for visual regressions
pnpm storybook
```

### 5. Commit Changes

```bash
# Commit the migration
git add .
git commit -m "Migrate hardcoded colors to semantic tokens"
```

## 🔧 Advanced Usage

### Dry Run Mode

To see what would be changed without actually modifying files:

```bash
# Create a copy of the codemod for dry run
cp packages/ui/scripts/codemods/replace-hardcoded-colors.ts packages/ui/scripts/codemods/replace-hardcoded-colors-dry.ts
```

Then modify the dry run version to only log changes:

```typescript
// In the dry run version, replace:
fs.writeFileSync(file, out, "utf8");

// With:
console.log("Would update:", path.relative(process.cwd(), file));
console.log("Changes:", out !== src ? "YES" : "NO");
```

### Selective Migration

```bash
# Only migrate specific components
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "src/components/Button/**/*"
```

### Exclude Patterns

```bash
# Exclude test files
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "src/**/*" --exclude "**/*.test.*"
```

## 🧪 Testing the Codemod

### Test with Sample Files

```bash
# Create test files
mkdir -p test-codemod
echo '<div className="bg-blue-600 text-red-500">Test</div>' > test-codemod/test.tsx

# Run codemod on test files
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "test-codemod/**/*"

# Check results
cat test-codemod/test.tsx
```

### Expected Output

```tsx
<div className="bg-semantic-primary text-semantic-error">Test</div>
```

## 🔍 Troubleshooting

### Common Issues

#### 1. No Files Changed

```bash
# Check if files match the pattern
ls apps/**/*.tsx
ls packages/**/*.tsx

# Use absolute paths if needed
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "$(pwd)/apps/**/*" "$(pwd)/packages/**/*"
```

#### 2. Partial Migration

```bash
# Check for missed patterns
grep -r "bg-.*-[0-9]" src/
grep -r "text-.*-[0-9]" src/
```

#### 3. Build Errors After Migration

```bash
# Check if semantic classes are available
grep -r "bg-semantic-primary" src/

# Verify Tailwind config includes semantic plugin
cat tailwind.config.js
```

### Debug Mode

Add debug logging to the codemod:

```typescript
// Add this to the codemod for debugging
console.log("Processing file:", file);
console.log("Original:", src.substring(0, 100));
console.log("Modified:", out.substring(0, 100));
```

## 📋 Best Practices

1. **Always backup** before running codemods
2. **Review changes** before committing
3. **Test thoroughly** after migration
4. **Run in small batches** for large codebases
5. **Use version control** to track changes
6. **Document custom mappings** for team consistency

## 🤝 Contributing

1. **Follow codemod patterns** - Use established conventions
2. **Add comprehensive tests** - Cover all edge cases
3. **Update documentation** - Keep examples current
4. **Test with real codebases** - Ensure practical usability

## 📄 License

MIT License - see LICENSE file for details.

---

**Need help?** Check the [AIBOS UI Documentation](../README.md) or create an issue in the repository.
