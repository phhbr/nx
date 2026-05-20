'use strict';

/**
 * Standalone Jest configuration for codemods tests.
 *
 * Uses ts-jest rather than Stencil's built-in Jest runner — the codemods are
 * plain TypeScript tooling, not Stencil components, so they need a separate
 * Jest config that doesn't rely on Stencil's testing infrastructure.
 *
 * Must be .cjs: the root package.json declares "type":"module", which makes
 * Node treat .js files as ESM. Jest's config loader uses require(), so the
 * config file must use the .cjs extension to force CommonJS loading.
 */
module.exports = {
  displayName: 'codemods',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironment: 'node',
};
