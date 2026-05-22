/**
 * Enhanced CLI tool to validate all codemods with JSON output and verbose logging.
 *
 * Usage (after codemods:build):
 *   node codemods/dist/validate.js
 *   node codemods/dist/validate.js --strict --format=json --verbose
 *   node codemods/dist/validate.js --transform <id>
 *
 * Or via Nx target:
 *   nx run dpl-web-components:codemods:validate
 *   nx run dpl-web-components:codemods:validate:strict
 *   nx run dpl-web-components:codemods:validate -- --transform <id> --verbose
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateManifest } from './validators/manifest-validator';
import { validateTransformModule } from './validators/transform-validator';
import { validateFixtures } from './validators/fixture-validator';
import { Formatter } from './cli-formatter';

interface CliArgs {
  strict: boolean;
  transform?: string;
  fix: boolean;
  format: 'human' | 'json';
  verbose: boolean;
  color: boolean;
  help: boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {
    strict: false,
    fix: false,
    format: 'human',
    verbose: false,
    color: process.stdout.isTTY ?? true,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--strict') {
      result.strict = true;
    } else if (arg === '--fix') {
      result.fix = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg === '--color') {
      result.color = true;
    } else if (arg === '--no-color') {
      result.color = false;
    } else if (arg.startsWith('--format=')) {
      const format = arg.slice(9);
      if (format === 'json' || format === 'human') {
        result.format = format;
      }
    } else if (arg === '--transform' && i + 1 < argv.length) {
      result.transform = argv[++i];
    } else if (arg.startsWith('--transform=')) {
      result.transform = arg.slice(11);
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Codemod Validation CLI

Usage: node codemods/dist/validate.js [options]

Options:
  --strict               Treat warnings as errors. Exit with code 1 if any issues found.
  --transform <id>      Validate only a specific transform.
  --fix                  Auto-fix issues where possible (not yet implemented).
  --format=json         Output results as JSON (default: human-readable).
  --verbose, -v         Show detailed validation logs.
  --color               Force color output (default: auto-detect TTY).
  --no-color            Disable color output.
  --help, -h            Show this help.

Examples:
  node codemods/dist/validate.js
  node codemods/dist/validate.js --strict
  node codemods/dist/validate.js --transform rename-dpl-button-variant-outline-to-ghost
  node codemods/dist/validate.js --strict --format=json --verbose
`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const formatter = new Formatter({
    format: args.format,
    verbose: args.verbose,
    color: args.color,
  });

  try {
    formatter.debug('Starting validation', {
      strict: args.strict,
      targetTransform: args.transform,
    });

    let manifest: any;
    let manifestDir = __dirname;
    try {
      const manifestPath = require.resolve('./manifest');
      manifestDir = path.dirname(manifestPath);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const manifestModule = require(manifestPath);
      manifest = manifestModule.default;
    } catch (e) {
      formatter.error('Failed to load manifest', {
        error: (e as Error).message,
      });
      process.exit(1);
    }

    formatter.info('Validating codemods...');
    const startTime = Date.now();

    // 1. Validate manifest
    formatter.debug('Validating manifest structure...');
    const manifestResult = validateManifest(manifest, manifestDir);

    let hasErrors = false;
    if (!manifestResult.valid) {
      formatter.error('Manifest validation failed');
      for (const err of manifestResult.errors) {
        formatter.error(`  ${err}`);
      }
      hasErrors = true;
    } else if (manifestResult.warnings.length > 0) {
      for (const warn of manifestResult.warnings) {
        formatter.warn(`  ${warn}`);
      }
      if (args.strict) hasErrors = true;
    } else {
      formatter.info(`✓ Manifest valid (${manifest.length} transforms)`);
    }

    // 2. Validate each transform
    formatter.debug(`Validating transforms (${args.transform ? 'filtered' : 'all'})...`);
    const transformResults: Array<{ id: string; result: ValidationResult; type: string }> =
      [];

    for (const entry of manifest) {
      if (args.transform && entry.id !== args.transform) continue;

      const transformPath = path.resolve(manifestDir, entry.transformPath + '.ts');
      const transformDist = path.resolve(manifestDir, entry.transformPath + '.js');

      // Try to load compiled version first, then source
      const toValidate = fs.existsSync(transformDist) ? transformDist : transformPath;

      formatter.debug(`Validating transform: ${entry.id}`);

      const result = validateTransformModule(toValidate);
      transformResults.push({ id: entry.id, result, type: 'transform' });

      if (!result.valid) {
        for (const err of result.errors) {
          formatter.error(`  [${entry.id}] ${err}`);
        }
        hasErrors = true;
      } else if (result.warnings.length > 0) {
        for (const warn of result.warnings) {
          formatter.warn(`  [${entry.id}] ${warn}`);
        }
        if (args.strict) hasErrors = true;
      } else {
        formatter.info(`✓ Transform valid: ${entry.id}`);
      }

      // 3. Validate fixtures
      formatter.debug(`Validating fixtures for: ${entry.id}`);
      const sourceTransformPath = path.resolve(
        manifestDir,
        '..',
        entry.transformPath + '.ts',
      );
      const sourceTransformDir = path.dirname(sourceTransformPath);
      const fixturesResult = validateFixtures(sourceTransformDir);
      transformResults.push({ id: entry.id, result: fixturesResult, type: 'fixtures' });

      if (!fixturesResult.valid) {
        for (const err of fixturesResult.errors) {
          formatter.error(`  [${entry.id}:fixtures] ${err}`);
        }
        hasErrors = true;
      } else if (fixturesResult.warnings.length > 0) {
        for (const warn of fixturesResult.warnings) {
          formatter.warn(`  [${entry.id}:fixtures] ${warn}`);
        }
        if (args.strict) hasErrors = true;
      } else {
        formatter.info(`✓ Fixtures valid: ${entry.id}`);
      }
    }

    const duration = Date.now() - startTime;

    const summary = {
      success: !hasErrors,
      strict: args.strict,
      transformCount: manifest.length,
      targetTransform: args.transform,
      manifestValid: manifestResult.valid,
      transformResults: transformResults.map((r) => ({
        id: r.id,
        type: r.type,
        valid: r.result.valid,
        errorCount: r.result.errors.length,
        warningCount: r.result.warnings.length,
      })),
    };

    formatter.result(summary, duration);

    process.exit(hasErrors ? 1 : 0);
  } catch (err) {
    formatter.error('Validation failed', {
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', (err as Error).message);
  process.exit(1);
});
