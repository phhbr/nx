export { runMigrations, loadMigrationsFromManifest, selectMigrations } from './runner';
export type { MigrationEntry, RunOptions, RunResult } from './types';
export { Formatter, type FormatterOptions } from './formatter';

import yargs from 'yargs/yargs';
import { Formatter } from './formatter';
import type { RunResult } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json') as { version: string };

/**
 * CLI entry point with support for JSON output and verbose logging.
 *
 * New options:
 *   --format=json     Output results as JSON (default: human-readable)
 *   --verbose         Show detailed logs and progress (default: off)
 *   --color           Force color output (default: auto-detect TTY)
 *   --no-color        Disable color output
 *
 * Usage:
 *   migrations --from=8.0.0 --to=9.0.0 --dir=./src
 *   migrations --from=8.0.0 --to=9.0.0 --dir=./src --format=json --verbose
 */
export async function runCli(argv: string[]): Promise<void> {
  const args = parseArgv(argv);

  if (args.version) {
    console.log(packageJson.version);
    process.exit(0);
  }

  if (args.help) {
    createCliParser([]).showHelp();
    process.exit(0);
  }

  const formatter = new Formatter({
    format: args.format,
    verbose: args.verbose,
    color: args.color,
  });

  try {
    const missing: string[] = [];
    if (!args.dir) missing.push('--dir');
    if (!args.from) missing.push('--from');
    if (!args.to) missing.push('--to');

    if (missing.length > 0) {
      formatter.error(`Missing required arguments: ${missing.join(', ')}`);
      if (args.format !== 'json') {
        createCliParser([]).showHelp();
      }
      process.exit(1);
    }

    formatter.debug('Starting migrations', {
      from: args.from,
      to: args.to,
      dir: args.dir,
      dryRun: args.dryRun,
      only: args.only,
    });

    const { runMigrations } = await import('./runner.js');

    formatter.info('Scanning files...');
    const startTime = Date.now();

    const result: RunResult = await runMigrations({
      dir: args.dir as string,
      from: args.from as string,
      to: args.to as string,
      dryRun: args.dryRun,
      only: args.only,
    });

    const duration = Date.now() - startTime;

    // Collect developer hints from migrations that had changes
    const developerHints = result.migrationsApplied
      .filter((m) => m.developerHint && m.filesModified > 0)
      .map((m) => ({ id: m.id, hint: m.developerHint }));

    if (developerHints.length > 0) {
      formatter.warn(
        `Developer hints for manual follow-up: ${developerHints
          .map((h) => `${h.id}: ${h.hint}`)
          .join('; ')}`,
      );
    }

    formatter.result(
      {
        filesScanned: result.filesScanned,
        filesModified: result.filesModified,
        migrations: result.migrationsApplied,
        dryRun: args.dryRun,
        developerHints: developerHints.length > 0 ? developerHints : undefined,
      },
      duration,
    );

    const hasErrors = result.migrationsApplied.some((m) => m.filesModified < 0);
    process.exit(hasErrors ? 1 : 0);
  } catch (err) {
    formatter.error((err as Error).message, {
      stack: (err as Error).stack,
    });
    process.exit(1);
  }
}

interface ParsedArgs {
  dir?: string;
  from?: string;
  to?: string;
  dryRun: boolean;
  only?: string[];
  format: 'human' | 'json';
  verbose: boolean;
  color: boolean;
  help: boolean;
  version: boolean;
}

export function parseArgv(argv: string[]): ParsedArgs {
  const parsed = createCliParser(argv).parseSync();
  const onlyValue = getStringArg(parsed, 'only');
  const only = typeof onlyValue === 'string'
    ? onlyValue.split(',').map((item: string) => item.trim()).filter(Boolean)
    : undefined;
  const formatValue = getStringArg(parsed, 'format');
  const format = formatValue === 'json' || formatValue === 'human'
    ? formatValue
    : 'human';

  return {
    dir: getStringArg(parsed, 'dir'),
    from: getStringArg(parsed, 'from'),
    to: getStringArg(parsed, 'to'),
    dryRun: getBooleanArg(parsed, ['dryRun', 'dry-run'], false),
    only,
    format,
    verbose: getBooleanArg(parsed, ['verbose', 'v'], false),
    color: getBooleanArg(parsed, ['color'], process.stdout.isTTY ?? true),
    help: getBooleanArg(parsed, ['help', 'h'], false),
    version: getBooleanArg(parsed, ['version'], false),
  };
}

function getStringArg(parsed: Record<string, unknown>, key: string): string | undefined {
  const value = parsed[key];
  return typeof value === 'string' ? value : undefined;
}

function getBooleanArg(
  parsed: Record<string, unknown>,
  keys: string[],
  fallback: boolean,
): boolean {
  for (const key of keys) {
    const value = parsed[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return fallback;
}

function createCliParser(argv: string[]) {
  return yargs(argv)
    .scriptName('migrations')
    .usage('Usage: $0 --from=<version> --to=<version> --dir=<path> [options]')
    .option('from', {
      type: 'string',
      describe: 'Starting version (exclusive lower bound). e.g. 8.0.0',
    })
    .option('to', {
      type: 'string',
      describe: 'Target version (inclusive upper bound). e.g. 9.0.0',
    })
    .option('dir', {
      type: 'string',
      describe: 'Directory to scan for files to transform (required).',
    })
    .option('only', {
      type: 'string',
      describe: 'Comma-separated list of migration IDs to run (optional).',
    })
    .option('dryRun', {
      type: 'boolean',
      alias: 'dry-run',
      default: false,
      describe: 'Show which files would be modified without writing them.',
    })
    .option('format', {
      type: 'string',
      default: 'human',
      describe: 'Output results as json or human (default: human-readable).',
    })
    .option('verbose', {
      type: 'boolean',
      alias: 'v',
      default: false,
      describe: 'Show detailed logs and progress information.',
    })
    .option('color', {
      type: 'boolean',
      default: process.stdout.isTTY ?? true,
      describe: 'Force color output (default: auto-detect TTY).',
    })
    .option('help', {
      type: 'boolean',
      alias: 'h',
      default: false,
      describe: 'Show this help message.',
    })
    .option('version', {
      type: 'boolean',
      default: false,
      describe: 'Show version number.',
    })
    .example('$0 --from=8.0.0 --to=9.0.0 --dir=./src', 'Standard migration')
    .example(
      '$0 --from=8.0.0 --to=9.0.0 --dir=./src --dry-run --verbose',
      'Dry run with verbose output',
    )
    .example(
      '$0 --from=8.0.0 --to=9.0.0 --dir=./src --format=json',
      'JSON output for CI/CD integration',
    )
    .example(
      '$0 --from=8.0.0 --to=9.0.0 --dir=./src --only=rename-prop,rename-attr',
      'Run specific migrations only',
    )
    .help(false)
    .version(false)
    .strict(false);
}
