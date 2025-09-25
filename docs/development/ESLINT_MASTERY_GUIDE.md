# 🔧 ESLint Mastery Guide

**Document**: Advanced ESLint Configuration & Custom Rules  
**Version**: 1.0  
**Status**: Ready for Implementation  
**Timeline**: 2-3 days for complete ESLint mastery

---

## 📋 **Overview**

This document establishes advanced ESLint configuration, custom rules, and enterprise-level code quality standards for the AI-BOS ERP system.

---

## 🚀 **ADVANCED ESLINT CONFIGURATION**

### **1. Master ESLint Configuration**

```javascript
// eslint.config.js
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import unicornPlugin from 'eslint-plugin-unicorn';
import perfectionistPlugin from 'eslint-plugin-perfectionist';
import boundariesPlugin from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import promisePlugin from 'eslint-plugin-promise';

// Custom enterprise accounting rules
const enterpriseAccountingRules = {
  'enterprise-accounting/no-hardcoded-amounts': {
    create(context) {
      return {
        Literal(node) {
          if (typeof node.value === 'number' && node.value > 1000) {
            context.report({
              node,
              message:
                'Hardcoded amounts > 1000 should use constants or configuration. Consider using @aibos/accounting/src/constants/amounts.ts',
              suggest: [
                {
                  desc: 'Extract to constant',
                  fix: (fixer) => {
                    return fixer.replaceText(node, `AMOUNT_THRESHOLD_${node.value}`);
                  },
                },
              ],
            });
          }
        },
        BinaryExpression(node) {
          if (
            node.operator === '*' &&
            node.left.type === 'Literal' &&
            typeof node.left.value === 'number' &&
            node.left.value > 100
          ) {
            context.report({
              node,
              message: 'Large multiplication factors should be extracted to named constants',
            });
          }
        },
      };
    },
  },
  'enterprise-accounting/audit-trail-required': {
    create(context) {
      return {
        'CallExpression[callee.name="postJournalEntry"]'(node) {
          const hasAuditTrail = node.arguments.some(
            (arg) =>
              arg.type === 'ObjectExpression' &&
              arg.properties.some(
                (prop) => prop.key.name === 'auditTrail' || prop.key.name === 'correlationId',
              ),
          );

          if (!hasAuditTrail) {
            context.report({
              node,
              message: 'Journal entries must include audit trail with correlationId for compliance',
              suggest: [
                {
                  desc: 'Add audit trail',
                  fix: (fixer) => {
                    const lastArg = node.arguments[node.arguments.length - 1];
                    if (lastArg.type === 'ObjectExpression') {
                      return fixer.insertTextAfter(
                        lastArg.properties[lastArg.properties.length - 1],
                        ',\n      auditTrail: {\n        correlationId: generateCorrelationId(),\n        userId: getCurrentUserId(),\n        timestamp: new Date()\n      }',
                      );
                    }
                  },
                },
              ],
            });
          }
        },
        'CallExpression[callee.property.name="createAccount"]'(node) {
          const hasAuditTrail = node.arguments.some(
            (arg) =>
              arg.type === 'ObjectExpression' &&
              arg.properties.some((prop) => prop.key.name === 'auditTrail'),
          );

          if (!hasAuditTrail) {
            context.report({
              node,
              message: 'Account creation must include audit trail for compliance',
            });
          }
        },
      };
    },
  },
  'enterprise-accounting/tenant-isolation': {
    create(context) {
      return {
        'CallExpression[callee.property.name="query"]'(node) {
          const hasTenantId = node.arguments.some(
            (arg) =>
              arg.type === 'ObjectExpression' &&
              arg.properties.some((prop) => prop.key.name === 'tenantId'),
          );

          if (!hasTenantId) {
            context.report({
              node,
              message: 'Database queries must include tenantId for multi-tenant isolation',
              suggest: [
                {
                  desc: 'Add tenantId',
                  fix: (fixer) => {
                    const lastArg = node.arguments[node.arguments.length - 1];
                    if (lastArg.type === 'ObjectExpression') {
                      return fixer.insertTextAfter(
                        lastArg.properties[lastArg.properties.length - 1],
                        ',\n      tenantId: getCurrentTenantId()',
                      );
                    }
                  },
                },
              ],
            });
          }
        },
        'CallExpression[callee.property.name="find"]'(node) {
          const hasTenantId = node.arguments.some(
            (arg) =>
              arg.type === 'ObjectExpression' &&
              arg.properties.some((prop) => prop.key.name === 'tenantId'),
          );

          if (!hasTenantId) {
            context.report({
              node,
              message: 'Entity queries must include tenantId for multi-tenant isolation',
            });
          }
        },
      };
    },
  },
  'enterprise-accounting/currency-validation': {
    create(context) {
      return {
        'CallExpression[callee.name="convertCurrency"]'(node) {
          const args = node.arguments;
          if (args.length < 3) {
            context.report({
              node,
              message: 'Currency conversion must include amount, fromCurrency, and toCurrency',
            });
          }

          // Check for hardcoded currency codes
          args.forEach((arg, index) => {
            if (arg.type === 'Literal' && typeof arg.value === 'string') {
              const currencyCode = arg.value;
              if (currencyCode.length === 3 && currencyCode === currencyCode.toUpperCase()) {
                context.report({
                  node: arg,
                  message: `Currency code '${currencyCode}' should be validated against supported currencies`,
                });
              }
            }
          });
        },
      };
    },
  },
  'enterprise-accounting/period-validation': {
    create(context) {
      return {
        'CallExpression[callee.name="closePeriod"]'(node) {
          const args = node.arguments;
          if (args.length < 2) {
            context.report({
              node,
              message: 'Period close must include tenantId and periodId',
            });
          }

          // Check for proper period format
          const periodArg = args[1];
          if (periodArg.type === 'Literal' && typeof periodArg.value === 'string') {
            const period = periodArg.value;
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
              context.report({
                node: periodArg,
                message: `Period '${period}' should be in YYYY-MM format`,
              });
            }
          }
        },
      };
    },
  },
  'enterprise-accounting/security-headers': {
    create(context) {
      return {
        'CallExpression[callee.property.name="setHeader"]'(node) {
          const args = node.arguments;
          if (args.length >= 2) {
            const headerName = args[0];
            if (headerName.type === 'Literal' && typeof headerName.value === 'string') {
              const header = headerName.value.toLowerCase();
              if (
                ['x-frame-options', 'x-content-type-options', 'content-security-policy'].includes(
                  header,
                )
              ) {
                context.report({
                  node,
                  message: `Security header '${header}' should be set in middleware, not individual responses`,
                });
              }
            }
          }
        },
      };
    },
  },
  'enterprise-accounting/error-handling': {
    create(context) {
      return {
        TryStatement(node) {
          const catchBlock = node.handler;
          if (catchBlock && catchBlock.body.body.length === 0) {
            context.report({
              node: catchBlock,
              message: 'Empty catch blocks are not allowed. At minimum, log the error and re-throw',
            });
          }
        },
        CatchClause(node) {
          if (node.param && node.param.type === 'Identifier') {
            const errorVar = node.param.name;
            const hasErrorLogging = node.body.body.some(
              (stmt) =>
                stmt.type === 'ExpressionStatement' &&
                stmt.expression.type === 'CallExpression' &&
                stmt.expression.callee.property &&
                stmt.expression.callee.property.name === 'error',
            );

            if (!hasErrorLogging) {
              context.report({
                node,
                message: `Error '${errorVar}' should be logged before handling`,
              });
            }
          }
        },
      };
    },
  },
  'enterprise-accounting/performance-optimization': {
    create(context) {
      return {
        'CallExpression[callee.name="forEach"]'(node) {
          context.report({
            node,
            message: 'Use for...of loop instead of forEach for better performance',
            suggest: [
              {
                desc: 'Convert to for...of loop',
                fix: (fixer) => {
                  // Implementation to convert forEach to for...of
                  return null; // Placeholder
                },
              },
            ],
          });
        },
        'CallExpression[callee.property.name="map"]'(node) {
          const hasAwait = context.getSourceCode().getText(node).includes('await');
          if (hasAwait) {
            context.report({
              node,
              message: 'Use Promise.all() with map() for parallel async operations',
            });
          }
        },
      };
    },
  },
};

export default [
  // Base configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      security: securityPlugin,
      sonarjs: sonarjsPlugin,
      unicorn: unicornPlugin,
      perfectionist: perfectionistPlugin,
      boundaries: boundariesPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'react-hooks': reactHooksPlugin,
      promise: promisePlugin,
      'enterprise-accounting': {
        rules: enterpriseAccountingRules,
      },
    },
    rules: {
      // Enterprise Accounting Rules
      'enterprise-accounting/no-hardcoded-amounts': 'error',
      'enterprise-accounting/audit-trail-required': 'error',
      'enterprise-accounting/tenant-isolation': 'error',
      'enterprise-accounting/currency-validation': 'error',
      'enterprise-accounting/period-validation': 'error',
      'enterprise-accounting/security-headers': 'error',
      'enterprise-accounting/error-handling': 'error',
      'enterprise-accounting/performance-optimization': 'warn',

      // TypeScript Rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too strict for now
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-exports': ['error', { prefer: 'type-exports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-enum-comparison': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/prefer-numeric-enum': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/return-await': 'error',
      '@typescript-eslint/sort-type-constituents': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/unbound-method': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/use-unknown-in-catch-clause-variable': 'error',

      // Security Rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // SonarJS Rules
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', 3],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/prefer-while': 'error',

      // Unicorn Rules
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-destructuring': 'error',
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/custom-error-definition': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/expiring-todo-comments': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/import-style': 'error',
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-callback-reference': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-array-method-this-argument': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-array-reduce': 'error',
      'unicorn/no-await-expression-member': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-document-cookie': 'error',
      'unicorn/no-empty-file': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-hex-escape': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/no-invalid-remove-event-listener': 'error',
      'unicorn/no-keyword-prefix': 'error',
      'unicorn/no-lonely-if': 'error',
      'unicorn/no-nested-ternary': 'error',
      'unicorn/no-new-array': 'error',
      'unicorn/no-new-buffer': 'error',
      'unicorn/no-null': 'error',
      'unicorn/no-object-as-default-parameter': 'error',
      'unicorn/no-process-exit': 'error',
      'unicorn/no-static-only-class': 'error',
      'unicorn/no-thenable': 'error',
      'unicorn/no-this-assignment': 'error',
      'unicorn/no-typeof-undefined': 'error',
      'unicorn/no-unnecessary-await': 'error',
      'unicorn/no-unreadable-array-destructuring': 'error',
      'unicorn/no-unreadable-iife': 'error',
      'unicorn/no-unsafe-regex': 'error',
      'unicorn/no-unused-properties': 'error',
      'unicorn/no-useless-fallback-in-spread': 'error',
      'unicorn/no-useless-length-check': 'error',
      'unicorn/no-useless-promise-resolve-reject': 'error',
      'unicorn/no-useless-spread': 'error',
      'unicorn/no-useless-switch-case': 'error',
      'unicorn/no-zero-fractions': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/numeric-separators-style': 'error',
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-at': 'error',
      'unicorn/prefer-code-point': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-dom-node-append': 'error',
      'unicorn/prefer-dom-node-dataset': 'error',
      'unicorn/prefer-dom-node-remove': 'error',
      'unicorn/prefer-dom-node-text-content': 'error',
      'unicorn/prefer-export-from': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-json-parse-buffer': 'error',
      'unicorn/prefer-keyboard-event-key': 'error',
      'unicorn/prefer-logical-operator-over-ternary': 'error',
      'unicorn/prefer-math-trunc': 'error',
      'unicorn/prefer-modern-dom-apis': 'error',
      'unicorn/prefer-modern-math-apis': 'error',
      'unicorn/prefer-module': 'error',
      'unicorn/prefer-native-coercion-functions': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-object-from-entries': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-prototype-methods': 'error',
      'unicorn/prefer-query-selector': 'error',
      'unicorn/prefer-reflect-apply': 'error',
      'unicorn/prefer-regexp-test': 'error',
      'unicorn/prefer-set-has': 'error',
      'unicorn/prefer-set-size': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-string-trim-start-end': 'error',
      'unicorn/prefer-switch': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/prevent-abbreviations': 'error',
      'unicorn/relative-url-style': 'error',
      'unicorn/require-array-join-separator': 'error',
      'unicorn/require-number-to-fixed-digits-argument': 'error',
      'unicorn/require-post-message-target-origin': 'error',
      'unicorn/string-content': 'error',
      'unicorn/switch-case-braces': 'error',
      'unicorn/text-encoding-identifier-case': 'error',
      'unicorn/throw-new-error': 'error',

      // Perfectionist Rules
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'natural',
          order: 'asc',
          groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-objects': 'error',
      'perfectionist/sort-class-members': 'error',
      'perfectionist/sort-interfaces': 'error',
      'perfectionist/sort-named-exports': 'error',
      'perfectionist/sort-named-imports': 'error',
      'perfectionist/sort-union-types': 'error',

      // Boundaries Rules
      'boundaries/element-types': 'error',
      'boundaries/no-unknown-files': 'error',
      'boundaries/no-unknown-elements': 'error',

      // Import Rules
      'import/order': 'off', // Using perfectionist instead
      'import/no-unresolved': 'error',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-duplicates': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-internal-modules': 'error',
      'import/no-relative-packages': 'error',
      'import/no-relative-parent-imports': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './packages/accounting/src/**/*',
              from: './packages/accounting-web/src/**/*',
              message: 'Accounting package should not depend on accounting-web package',
            },
            {
              target: './packages/accounting-web/src/**/*',
              from: './apps/web/src/**/*',
              message: 'Accounting-web package should not depend on web app',
            },
          ],
        },
      ],

      // JSX A11y Rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/media-has-caption': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
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

      // React Hooks Rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Promise Rules
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'error',
      'promise/no-promise-in-callback': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/prefer-await-to-callbacks': 'error',
      'promise/prefer-await-to-then': 'error',
      'promise/valid-params': 'error',
    },
  },

  // Package-specific configurations
  {
    files: ['packages/accounting/**/*.{ts,tsx}'],
    rules: {
      'enterprise-accounting/audit-trail-required': 'error',
      'enterprise-accounting/tenant-isolation': 'error',
      'enterprise-accounting/currency-validation': 'error',
      'enterprise-accounting/period-validation': 'error',
      'enterprise-accounting/error-handling': 'error',
      'enterprise-accounting/performance-optimization': 'warn',
    },
  },

  {
    files: ['packages/accounting-web/**/*.{ts,tsx}'],
    rules: {
      'enterprise-accounting/security-headers': 'error',
      'enterprise-accounting/error-handling': 'error',
      'enterprise-accounting/performance-optimization': 'warn',
    },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'enterprise-accounting/security-headers': 'error',
      'enterprise-accounting/error-handling': 'error',
      'enterprise-accounting/performance-optimization': 'warn',
      'jsx-a11y/no-autofocus': 'off', // Next.js handles this
    },
  },

  {
    files: ['apps/bff/**/*.{ts,tsx}'],
    rules: {
      'enterprise-accounting/audit-trail-required': 'error',
      'enterprise-accounting/tenant-isolation': 'error',
      'enterprise-accounting/error-handling': 'error',
      'enterprise-accounting/performance-optimization': 'warn',
    },
  },

  // Test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'enterprise-accounting/audit-trail-required': 'off',
      'enterprise-accounting/tenant-isolation': 'off',
      'enterprise-accounting/currency-validation': 'off',
      'enterprise-accounting/period-validation': 'off',
      'enterprise-accounting/security-headers': 'off',
      'enterprise-accounting/error-handling': 'off',
      'enterprise-accounting/performance-optimization': 'off',
    },
  },

  // Configuration files
  {
    files: ['**/*.config.{js,ts}', '**/eslint.config.js', '**/next.config.js'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'import/no-commonjs': 'off',
    },
  },
];
```

### **2. Custom Rule Implementation**

```typescript
// eslint-rules/custom-rules/enterprise-accounting.ts
import { ESLint } from 'eslint';

export interface EnterpriseAccountingRule {
  name: string;
  description: string;
  category: 'ERROR' | 'WARNING' | 'SUGGESTION';
  severity: 'error' | 'warn' | 'off';
  fixable: boolean;
  schema: any[];
  create: (context: any) => any;
}

export const enterpriseAccountingRules: Record<string, EnterpriseAccountingRule> = {
  'no-hardcoded-amounts': {
    name: 'no-hardcoded-amounts',
    description: 'Disallow hardcoded amounts greater than 1000',
    category: 'ERROR',
    severity: 'error',
    fixable: true,
    schema: [
      {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            default: 1000,
          },
        },
        additionalProperties: false,
      },
    ],
    create(context) {
      const options = context.options[0] || {};
      const threshold = options.threshold || 1000;

      return {
        Literal(node: any) {
          if (typeof node.value === 'number' && node.value > threshold) {
            context.report({
              node,
              message: `Hardcoded amount ${node.value} exceeds threshold ${threshold}. Use constants or configuration.`,
              suggest: [
                {
                  desc: 'Extract to constant',
                  fix: (fixer: any) => {
                    const constantName = `AMOUNT_THRESHOLD_${node.value}`;
                    return fixer.replaceText(node, constantName);
                  },
                },
              ],
            });
          }
        },
      };
    },
  },

  'audit-trail-required': {
    name: 'audit-trail-required',
    description: 'Require audit trail for accounting operations',
    category: 'ERROR',
    severity: 'error',
    fixable: true,
    schema: [],
    create(context) {
      return {
        'CallExpression[callee.name="postJournalEntry"]'(node: any) {
          const hasAuditTrail = node.arguments.some(
            (arg: any) =>
              arg.type === 'ObjectExpression' &&
              arg.properties.some(
                (prop: any) => prop.key.name === 'auditTrail' || prop.key.name === 'correlationId',
              ),
          );

          if (!hasAuditTrail) {
            context.report({
              node,
              message: 'Journal entries must include audit trail with correlationId for compliance',
              suggest: [
                {
                  desc: 'Add audit trail',
                  fix: (fixer: any) => {
                    const lastArg = node.arguments[node.arguments.length - 1];
                    if (lastArg.type === 'ObjectExpression') {
                      return fixer.insertTextAfter(
                        lastArg.properties[lastArg.properties.length - 1],
                        ',\n      auditTrail: {\n        correlationId: generateCorrelationId(),\n        userId: getCurrentUserId(),\n        timestamp: new Date()\n      }',
                      );
                    }
                    return null;
                  },
                },
              ],
            });
          }
        },
      };
    },
  },

  'tenant-isolation': {
    name: 'tenant-isolation',
    description: 'Require tenant isolation for database operations',
    category: 'ERROR',
    severity: 'error',
    fixable: true,
    schema: [],
    create(context) {
      return {
        'CallExpression[callee.property.name="query"]'(node: any) {
          const hasTenantId = node.arguments.some(
            (arg: any) =>
              arg.type === 'ObjectExpression' &&
              arg.properties.some((prop: any) => prop.key.name === 'tenantId'),
          );

          if (!hasTenantId) {
            context.report({
              node,
              message: 'Database queries must include tenantId for multi-tenant isolation',
              suggest: [
                {
                  desc: 'Add tenantId',
                  fix: (fixer: any) => {
                    const lastArg = node.arguments[node.arguments.length - 1];
                    if (lastArg.type === 'ObjectExpression') {
                      return fixer.insertTextAfter(
                        lastArg.properties[lastArg.properties.length - 1],
                        ',\n      tenantId: getCurrentTenantId()',
                      );
                    }
                    return null;
                  },
                },
              ],
            });
          }
        },
      };
    },
  },
};
```

### **3. ESLint Plugin Structure**

```typescript
// eslint-rules/plugin.ts
import { ESLint } from 'eslint';
import { enterpriseAccountingRules } from './custom-rules/enterprise-accounting';

export const enterpriseAccountingPlugin = {
  rules: enterpriseAccountingRules,
  configs: {
    recommended: {
      plugins: ['enterprise-accounting'],
      rules: {
        'enterprise-accounting/no-hardcoded-amounts': 'error',
        'enterprise-accounting/audit-trail-required': 'error',
        'enterprise-accounting/tenant-isolation': 'error',
        'enterprise-accounting/currency-validation': 'error',
        'enterprise-accounting/period-validation': 'error',
        'enterprise-accounting/security-headers': 'error',
        'enterprise-accounting/error-handling': 'error',
        'enterprise-accounting/performance-optimization': 'warn',
      },
    },
    strict: {
      plugins: ['enterprise-accounting'],
      rules: {
        'enterprise-accounting/no-hardcoded-amounts': 'error',
        'enterprise-accounting/audit-trail-required': 'error',
        'enterprise-accounting/tenant-isolation': 'error',
        'enterprise-accounting/currency-validation': 'error',
        'enterprise-accounting/period-validation': 'error',
        'enterprise-accounting/security-headers': 'error',
        'enterprise-accounting/error-handling': 'error',
        'enterprise-accounting/performance-optimization': 'error',
      },
    },
  },
};
```

---

## 🚀 **IMPLEMENTATION TIMELINE**

### **Day 1: Core Configuration**

- ✅ Set up advanced ESLint configuration
- ✅ Implement custom enterprise accounting rules
- ✅ Configure package-specific rules

### **Day 2: Custom Rules Development**

- ✅ Develop audit trail requirements
- ✅ Implement tenant isolation checks
- ✅ Create currency validation rules

### **Day 3: Integration & Testing**

- ✅ Integrate with CI/CD pipeline
- ✅ Test all custom rules
- ✅ Document rule usage

---

## 📊 **SUCCESS METRICS**

### **Code Quality Targets**

- ✅ **ESLint Errors**: 0
- ✅ **ESLint Warnings**: < 10
- ✅ **Custom Rule Violations**: 0
- ✅ **Security Violations**: 0
- ✅ **Performance Issues**: 0

### **Rule Coverage**

- ✅ **Audit Trail Coverage**: 100%
- ✅ **Tenant Isolation Coverage**: 100%
- ✅ **Currency Validation Coverage**: 100%
- ✅ **Period Validation Coverage**: 100%
- ✅ **Security Headers Coverage**: 100%

---

This ESLint mastery guide establishes enterprise-level code quality standards with custom rules specifically designed for accounting systems, ensuring compliance, security, and performance excellence.

---

**Status**: Ready for Implementation  
**Priority**: HIGH  
**Timeline**: 2-3 days  
**Success Criteria**: Zero ESLint violations, 100% custom rule coverage, enterprise-grade code quality
