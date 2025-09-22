export default {
  forbidden: [
    // Forbid dependencies from packages to apps
    {
      name: 'no-packages-to-apps',
      severity: 'error',
      from: {
        path: '^packages',
      },
      to: {
        path: '^apps',
      },
    },

    // Forbid dependencies from packages to services
    {
      name: 'no-packages-to-services',
      severity: 'error',
      from: {
        path: '^packages',
      },
      to: {
        path: '^services',
      },
    },

    // Forbid dependencies from services to apps (services are headless)
    {
      name: 'no-services-to-apps',
      severity: 'error',
      from: {
        path: '^services',
      },
      to: {
        path: '^apps',
      },
    },

    // Forbid deep imports into package internals from outside packages
    {
      name: 'no-deep-imports-into-packages',
      severity: 'error',
      from: { path: '^(apps|services)/' },
      to: { path: '^packages/[^/]+/(src|internal)/' },
      comment: 'Consumers must import package public API (package root / index.ts)',
    },

    // Apps may depend on services ONLY through the public entry (index.ts) – no internals
    {
      name: 'apps-only-to-services-public-api',
      severity: 'error',
      from: { path: '^apps/' },
      to: {
        path: '^services/[^/]+/(?!index\\.(ts|js)$).*', // anything that is not the service root entry
        pathNot: '^services/[^/]+/index\\.(ts|js)$',
      },
      comment: 'Apps must import services via their public entry point only',
    },

    // Forbid circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      from: { pathNot: '(^|/)entities(/|$)' },
      to: {
        circular: true,
      },
      comment: 'Circular dependencies are not allowed except in entity relationships',
    },

    // Forbid orphaned modules
    {
      name: 'no-orphans',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: '.*\\.(config|d)\\.(ts|js)$',
      },
      to: {},
      comment: 'Orphaned files are allowed in build outputs and configuration files',
    },

    // Disallow unresolved imports (typos, missing alias config, etc.)
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true,
      },
    },

    // Prevent declaring the same package in multiple dep types (e.g., dep + peerDep)
    {
      name: 'no-duplicate-dep-types',
      severity: 'error',
      from: {},
      to: { moreThanOneDependencyType: true },
    },

    // Forbid dependencies to deprecated modules
    {
      name: 'no-deprecated-core',
      severity: 'error',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$',
      },
    },
  ],
  options: {
    // TS/alias aware resolution (adjust path if your tsconfig lives elsewhere)
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    doNotFollow: {
      path: '(^|/)node_modules($|/)|(^|/)(dist|build|.next)($|/)',
    },
    exclude: {
      path:
        '(^|/)(node_modules|dist|build|coverage|.next|storybook-static)($|/)|' +
        '\\.(test|spec|stories)\\.(ts|tsx|js|jsx)$|(__mocks__|__fixtures__)',
    },
  },
};
