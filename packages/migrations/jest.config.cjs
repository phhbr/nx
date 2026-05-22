'use strict';

/**
 * Jest configuration for migrations tests.
 *
 * Uses ts-jest for plain TypeScript tooling.
 *
 * Must be .cjs: the root package.json declares "type":"module", which makes
 * Node treat .js files as ESM. Jest's config loader uses require(), so the
 * config file must use the .cjs extension to force CommonJS loading.
 */
module.exports = {
  displayName: 'migrations',
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
