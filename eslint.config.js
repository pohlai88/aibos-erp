import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import perfectionist from 'eslint-plugin-perfectionist';
import promise from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';
import security from 'eslint-plugin-security';
import unicorn from 'eslint-plugin-unicorn';
import jsxA11y from 'eslint-plugin-jsx-a11y';
// import nextPlugin from 'eslint-config-next'; // Temporarily disabled due to compatibility issues

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
                Element: 'readonly',
                Event: 'readonly',
                // Other globals
                btoa: 'readonly',
                atob: 'readonly',
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
                    groups: [
                        'type',
                        ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                    ],
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
            'boundaries/ignore': [
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/*.config.ts',
                '**/*.d.ts',
            ],
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
        files: ['**/*.test.ts', '**/*.spec.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'import/no-extraneous-dependencies': 'off',
        },
    },

    // Config files
    {
        files: ['**/*.config.{js,cjs,ts}', 'scripts/**/*.{js,ts}'],
        languageOptions: {
            globals: {
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
            },
        },
        rules: {
            'unicorn/prefer-module': 'off',
            'import/no-commonjs': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            'no-undef': 'off', // Config files often use global variables
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
        },
    },

    // Next.js app specific configuration
    {
        files: ['apps/web/**/*.{ts,tsx}'],
        rules: {
            // Next.js specific rules will be added here when compatibility is resolved
            // For now, using base configuration
        },
    },
];
