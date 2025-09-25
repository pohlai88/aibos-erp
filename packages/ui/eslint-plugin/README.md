# eslint-plugin-aibos-ui

**Anti-drift ESLint plugin for AIBOS UI design system**

Prevents hardcoded Tailwind palette classes and enforces semantic tokens to maintain design system consistency.

## 🚀 Installation

```bash
# Install the plugin
pnpm add -D eslint-plugin-aibos-ui

# Or install from workspace
pnpm add -D @aibos/ui/eslint-plugin
```

## 📦 Usage

### Basic Configuration

```json
// .eslintrc.json
{
  "plugins": ["aibos-ui"],
  "rules": {
    "aibos-ui/no-hardcoded-palette": "error"
  }
}
```

### With Options

```json
{
  "plugins": ["aibos-ui"],
  "rules": {
    "aibos-ui/no-hardcoded-palette": [
      "error", 
      { 
        "allow": ["bg-transparent", "^ring-offset-"] 
      }
    ]
  }
}
```

## 🛡️ Rules

### no-hardcoded-palette

Disallows hardcoded Tailwind palette classes and enforces semantic tokens.

#### ❌ Disallowed

```tsx
// Hardcoded palette classes
<div className="bg-blue-600 text-white" />
<button className="border-red-500 ring-emerald-300" />
<span className="text-gray-200 bg-slate-800" />
```

#### ✅ Allowed

```tsx
// Semantic tokens
<div className="bg-semantic-primary text-white" />
<button className="border-semantic-error ring-semantic-success" />
<span className="text-semantic-secondary bg-semantic-muted" />

// Allowed patterns (if configured)
<div className="bg-transparent" />
<button className="ring-offset-blue-500" />
```

#### Options

- `allow`: `string[]` - Array of regex patterns to allow

**Example:**
```json
{
  "allow": [
    "bg-transparent",
    "^ring-offset-",
    "text-current"
  ]
}
```

## 🎯 Supported Color Classes

The rule detects these Tailwind color utilities:

### Background Colors
- `bg-{color}-{shade}` (e.g., `bg-blue-600`)

### Text Colors  
- `text-{color}-{shade}` (e.g., `text-red-500`)

### Border Colors
- `border-{color}-{shade}` (e.g., `border-gray-200`)

### Ring Colors
- `ring-{color}-{shade}` (e.g., `ring-emerald-300`)
- `ring-offset-{color}-{shade}` (e.g., `ring-offset-blue-500`)

### Other Utilities
- `fill-{color}-{shade}`
- `stroke-{color}-{shade}`
- `from-{color}-{shade}`
- `via-{color}-{shade}`
- `to-{color}-{shade}`
- `outline-{color}-{shade}`

## 🎨 Semantic Token Mapping

Instead of hardcoded colors, use semantic tokens:

| Hardcoded | Semantic Token |
|-----------|----------------|
| `bg-blue-600` | `bg-semantic-primary` |
| `text-red-500` | `text-semantic-error` |
| `border-green-500` | `border-semantic-success` |
| `ring-yellow-400` | `ring-semantic-warning` |

## 🔧 Configuration Examples

### Strict Mode (Recommended)

```json
{
  "plugins": ["aibos-ui"],
  "rules": {
    "aibos-ui/no-hardcoded-palette": "error"
  }
}
```

### With Exceptions

```json
{
  "plugins": ["aibos-ui"],
  "rules": {
    "aibos-ui/no-hardcoded-palette": [
      "error",
      {
        "allow": [
          "bg-transparent",
          "text-current",
          "^ring-offset-"
        ]
      }
    ]
  }
}
```

### Warning Mode

```json
{
  "plugins": ["aibos-ui"],
  "rules": {
    "aibos-ui/no-hardcoded-palette": "warn"
  }
}
```

## 🚀 Migration

### Automated Migration

Use the codemod script to automatically migrate existing hardcoded colors:

```bash
pnpm tsx packages/ui/scripts/codemods/replace-hardcoded-colors.ts "apps/**/*" "packages/**/*"
```

### Manual Migration

1. **Identify hardcoded colors** in your codebase
2. **Replace with semantic tokens** using the mapping table
3. **Test thoroughly** to ensure visual consistency
4. **Enable the ESLint rule** to prevent future drift

## 🧪 Testing

```bash
# Test the plugin
pnpm test

# Test with sample files
npx eslint src/**/*.tsx --plugin aibos-ui
```

## 🔍 Troubleshooting

### Common Issues

#### 1. False Positives

If the rule incorrectly flags valid classes:

```json
{
  "allow": ["bg-transparent", "text-current"]
}
```

#### 2. Missing Semantic Classes

Ensure your Tailwind config includes the semantic plugin:

```js
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss/plugin')(function({ addUtilities }) {
      // Semantic utilities plugin
    })
  ]
}
```

#### 3. Build Errors

If you get build errors after enabling the rule:

1. **Run the codemod** to migrate existing colors
2. **Check for missed patterns** in the allow list
3. **Verify semantic classes** are available in your build

## 📋 Best Practices

1. **Enable early** - Add the rule during initial setup
2. **Use semantic tokens** - Always prefer semantic over hardcoded
3. **Configure exceptions** - Only allow necessary patterns
4. **Regular audits** - Run the rule regularly in CI/CD
5. **Team training** - Educate team on semantic token usage

## 🤝 Contributing

1. **Follow ESLint plugin patterns** - Use established conventions
2. **Add comprehensive tests** - Cover all edge cases
3. **Update documentation** - Keep examples current
4. **Test with real codebases** - Ensure practical usability

## 📄 License

MIT License - see LICENSE file for details.

---

**Need help?** Check the [AIBOS UI Documentation](../README.md) or create an issue in the repository.