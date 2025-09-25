import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-plugin-prettier';
import promise from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
// import nextPlugin from 'eslint-config-next'; // Temporarily disabled due to ESLint compatibility issues

export default [
  // Base configuration
  js.configs.recommended,

  // Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '**/*.gen.ts',
      '**/*.generated.ts',
      '**/dist/**',
      '**/build/**',
      '**/apps/web/.next/**',
      '**/apps/web/.next/types/**',
      '**/apps/web/.next/static/**',
      '**/apps/web/.next/server/**',
    ],
  },

  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Node.js globals
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        crypto: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        // React/JSX globals
        JSX: 'readonly',
        React: 'readonly',
        // HTML globals
        HTMLInputElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        // Other globals
        btoa: 'readonly',
        atob: 'readonly',
        URL: 'readonly',
        // Test globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        // CommonJS globals
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      boundaries,
      import: importPlugin,
      perfectionist,
      promise,
      sonarjs,
      security,
      unicorn,
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
    },
    rules: {
      // Enhanced TypeScript rules
      '@typescript-eslint/no-explicit-any': [
        'error',
        { fixToUnknown: true, ignoreRestArgs: false },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Boundaries rules (architectural lineage) - temporarily disabled for baseline
      'boundaries/element-types': 'off',
      'boundaries/no-unknown-files': 'off',

      // Import hygiene - using Perfectionist for deterministic sorting
      'import/order': 'off',
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          groups: ['type', ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']],
          newlinesBetween: 'always',
          internalPattern: ['^(@aibos|~)/'],
          ignoreCase: false,
        },
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.ts',
            '**/*.spec.ts',
            '**/test/**',
            '**/__tests__/**',
            '**/*.config.{js,cjs,ts}',
            'scripts/**',
          ],
        },
      ],

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

      // Enhanced Code quality rules (Unicorn rules)
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-query-selector': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            args: true,
            env: true,
            db: true,
            id: true,
            params: true,
            props: true,
            ref: true,
            req: true,
            res: true,
            api: true,
            pkg: true,
            src: true,
            ts: true,
            tx: true,
            ulid: true,
            uuid: true,
            i18n: true,
            erp: true,
            ui: true,
            bff: true,
            crm: true,
            hrm: true,
            scm: true,
            wms: true,
          },
        },
      ],

      // Local policies
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'lucide-react',
              message: 'Use @aibos/ui/icons wrapper to avoid heavy bundles.',
            },
            {
              name: 'lodash',
              message: 'Use lodash-es per‑method imports or stdlib.',
            },
          ],
          patterns: [
            // No deep internal paths across services
            '@aibos/*/src/*',
          ],
        },
      ],
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
      },
      'import/internal-regex': '^(@aibos|~)/',
      'boundaries/elements': [
        { type: 'packages', pattern: 'packages/*/src/**/*' },
        { type: 'apps', pattern: 'apps/*/src/**/*' },
        { type: 'services', pattern: 'services/*/src/**/*' },
      ],
      'boundaries/ignore': ['**/*.test.ts', '**/*.spec.ts', '**/*.config.ts', '**/*.d.ts'],
    },
  },

  // React/JSX specific rules
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
      'jsx-a11y/tabindex-no-positive': 'error',
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-extraneous-dependencies': 'off',
      'no-unused-vars': 'off', // Allow unused vars in tests
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Config files and scripts
  {
    files: ['**/*.config.{js,cjs,ts}', 'scripts/**/*.{js,ts,cjs,mjs}'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'unicorn/prefer-module': 'off',
      'import/no-commonjs': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off', // Config files often use global variables
      'no-unused-vars': 'off', // Scripts often have unused vars
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // UI package specific rules
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      // Keep explicit types for library surface; relax for internal fns
      '@typescript-eslint/explicit-module-boundary-types': ['warn'],

      // Prefer undefined in React code; we'll codemod nulls away
      'unicorn/no-null': ['error'],

      // Allow common React abbreviations; keep everything else strict
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            Props: true,
            Ref: true,
            refs: true,
            prop: true,
            props: true,
            utils: true, // Allow utils.ts filename
            // Keep existing allowList from root config
            args: true,
            env: true,
            db: true,
            id: true,
            params: true,
            ref: true,
            req: true,
            res: true,
            api: true,
            pkg: true,
            src: true,
            ts: true,
            tx: true,
            ulid: true,
            uuid: true,
            i18n: true,
            erp: true,
            ui: true,
            bff: true,
            crm: true,
            hrm: true,
            scm: true,
            wms: true,
          },
        },
      ],

      // Guarded dynamic access is okay with justification comments
      'security/detect-object-injection': 'error',

      // Keep complexity realistic, fail egregious cases
      'sonarjs/cognitive-complexity': ['error', 20],
      // Disable perfectionist import sorting for UI package (too strict)
      'perfectionist/sort-imports': 'off',
      // Handle unused vars in UI package
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Next.js app specific configuration
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      // Next.js specific rules - manually configured due to ESLint compatibility issues
      // These rules are equivalent to what eslint-config-next would provide
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      // Disable some rules that conflict with Next.js patterns
      'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component handles this
      'import/no-anonymous-default-export': 'off', // Next.js pages use default exports
    },
  },

  // BFF package (NestJS) - handle injected dependencies
  {
    files: ['apps/bff/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Eventsourcing package - handle unused vars and any types
  {
    files: ['packages/eventsourcing/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Accounting package - handle unused vars and enum values
  {
    files: ['packages/accounting/**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // ------------- GLOBAL PRETTIER INTEGRATION -------------
  // Put this LAST so it can disable conflicting formatting rules and surface Prettier issues.
  {
    name: 'prettier/global',
    plugins: { prettier },
    rules: {
      // Run Prettier as an ESLint rule; any deviation becomes a fixable error.
      'prettier/prettier': [
        'error',
        {
          // keep in sync with .prettierrc.json
          printWidth: 100,
          singleQuote: true,
          semi: true,
          trailingComma: 'all',
          arrowParens: 'always',
          bracketSpacing: true,
          bracketSameLine: false,
          tabWidth: 2,
          endOfLine: 'lf',
          plugins: ['prettier-plugin-tailwindcss'],
        },
      ],
    },
  },

  // ------------- TURN OFF ESLINT-FORMATTING CONFLICTS -------------
  // This emulates eslint-config-prettier behavior for flat configs.
  {
    name: 'prettier/compat',
    rules: {
      // If you had any formatting-ish rules turned on, disable them here:
      // Examples (uncomment if present elsewhere):
      // 'arrow-body-style': 'off',
      // 'prefer-arrow-callback': 'off',
    },
  },
];
