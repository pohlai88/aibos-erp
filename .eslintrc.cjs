/* eslint-disable no-undef */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  env: { browser: true, node: true, es2023: true },
  reportUnusedDisableDirectives: true,
  plugins: [
    '@typescript-eslint',
    'boundaries',
    'import',
    'perfectionist',
    'promise',
    'sonarjs',
    'security',
    'unicorn',
    'jsx-a11y'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:boundaries/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:promise/recommended',
    'plugin:sonarjs/recommended',
    'plugin:security/recommended',
    'plugin:unicorn/recommended',
    'plugin:jsx-a11y/strict'
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'coverage/',
    '**/*.gen.ts',
    '**/*.generated.ts'
  ],
  settings: {
    'import/resolver': {
      node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] }
    },
    'import/internal-regex': '^(@aibos|~)/',
    'boundaries/elements': [
      { type: 'packages', pattern: 'packages/*/src/**/*' },
      { type: 'apps', pattern: 'apps/*/src/**/*' },
      { type: 'services', pattern: 'services/*/src/**/*' }
    ],
    'boundaries/ignore': ['**/*.test.ts', '**/*.spec.ts', '**/*.config.ts', '**/*.d.ts']
  },
  rules: {
    // Enhanced TypeScript rules
    '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true, ignoreRestArgs: false }],
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    
    // Boundaries rules (architectural lineage) - temporarily disabled for baseline
    'boundaries/element-types': 'off',
    'boundaries/no-unknown-files': 'off',
    
    // Import hygiene - using Perfectionist for deterministic sorting
    'import/order': 'off',
    'perfectionist/sort-imports': ['error', {
      type: 'natural',
      groups: ['type', ['builtin','external','internal','parent','sibling','index']]
    }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
        '**/__tests__/**',
        '**/*.config.{js,cjs,ts}',
        'scripts/**'
      ]
    }],
    
    // Enhanced Security rules (12 additional rules)
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-new-buffer': 'error',
    
    // Performance rules
    'sonarjs/no-duplicate-string': 'error',
    'sonarjs/no-identical-functions': 'error',
    'sonarjs/no-redundant-boolean': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/prefer-immediate-return': 'error',
    'sonarjs/prefer-single-boolean-return': 'error',
    
    // Accessibility rules (25 JSX-a11y rules) - handled in overrides for React files only
    
    // Enhanced Code quality rules (6 Unicorn rules)
    'unicorn/prefer-module': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/prefer-query-selector': 'error',
    'unicorn/prefer-string-slice': 'error',
    'unicorn/prefer-text-content': 'error',
    'unicorn/prefer-type-error': 'error',
    'unicorn/prevent-abbreviations': ['error', {
      allowList: {
        args: true, env: true, db: true, id: true, params: true, props: true,
        ref: true, req: true, res: true, api: true, pkg: true, src: true,
        ts: true, tx: true, ulid: true, uuid: true, i18n: true, erp: true,
        ui: true, bff: true, crm: true, hrm: true, scm: true, wms: true
      }
    }],
    
    // Local policies
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'lucide-react', message: 'Use @aibos/ui/icons wrapper to avoid heavy bundles.' },
          { name: 'lodash', message: 'Use lodash-es per‑method imports or stdlib.' }
        ],
        patterns: [
          // No deep internal paths across services
          '@aibos/*/src/*'
        ]
      }
    ]
  },
  overrides: [
    { 
      files: ['**/*.ts','**/*.tsx'], 
      rules: {
        // Disable JSX-a11y rules for non-React files
        'jsx-a11y/alt-text': 'off',
        'jsx-a11y/anchor-has-content': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'jsx-a11y/aria-props': 'off',
        'jsx-a11y/aria-proptypes': 'off',
        'jsx-a11y/aria-unsupported-elements': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/heading-has-content': 'off',
        'jsx-a11y/html-has-lang': 'off',
        'jsx-a11y/iframe-has-title': 'off',
        'jsx-a11y/img-redundant-alt': 'off',
        'jsx-a11y/no-access-key': 'off',
        'jsx-a11y/no-autofocus': 'off',
        'jsx-a11y/no-distracting-elements': 'off',
        'jsx-a11y/no-interactive-element-to-noninteractive-role': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'jsx-a11y/no-noninteractive-element-to-interactive-role': 'off',
        'jsx-a11y/no-noninteractive-tabindex': 'off',
        'jsx-a11y/no-redundant-roles': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/role-has-required-aria-props': 'off',
        'jsx-a11y/role-supports-aria-props': 'off',
        'jsx-a11y/scope': 'off',
        'jsx-a11y/tabindex-no-positive': 'off'
      }
    },
    { 
      files: ['**/*.tsx'], 
      rules: {
        // Re-enable JSX-a11y rules for React files
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/anchor-is-valid': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/click-events-have-key-events': 'error',
        'jsx-a11y/heading-has-content': 'error',
        'jsx-a11y/html-has-lang': 'error',
        'jsx-a11y/iframe-has-title': 'error',
        'jsx-a11y/img-redundant-alt': 'error',
        'jsx-a11y/no-access-key': 'error',
        'jsx-a11y/no-autofocus': 'error',
        'jsx-a11y/no-distracting-elements': 'error',
        'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
        'jsx-a11y/no-noninteractive-element-interactions': 'error',
        'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
        'jsx-a11y/no-noninteractive-tabindex': 'error',
        'jsx-a11y/no-redundant-roles': 'error',
        'jsx-a11y/no-static-element-interactions': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/role-supports-aria-props': 'error',
        'jsx-a11y/scope': 'error',
        'jsx-a11y/tabindex-no-positive': 'error'
      }
    },
    { 
      files: ['**/*.test.ts','**/*.spec.ts'],
      rules: { 
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['**/*.config.{js,cjs,ts}','scripts/**/*.{js,ts}'],
      rules: {
        'unicorn/prefer-module': 'off',
        'import/no-commonjs': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ]
}