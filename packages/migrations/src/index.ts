export { runMigrations, loadMigrationsFromManifest, selectMigrations } from './runner';
export type { MigrationEntry, RunOptions, RunResult } from './types';
export { Formatter, type FormatterOptions } from './formatter';

import { Formatter } from './formatter';

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
    const missing: string[] = [];
    if (!args.dir) missing.push('--dir');
    if (!args.from) missing.push('--from');
    if (!args.to) missing.push('--to');

    if (missing.length > 0) {
      formatter.error(`Missing required arguments: ${missing.join(', ')}`);
      if (args.format !== 'json') {
        printHelp();
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

    const { runMigrations } = await import('./runner');

    formatter.info('Scanning files...');
    const startTime = Date.now();

    const result = await runMigrations({
      dir: args.dir as string,
      from: args.from as string,
      to: args.to as string,
      dryRun: args.dryRun,
      only: args.only,
    });

    const duration = Date.now() - startTime;

    formatter.info(`Processing complete`, {
      filesScanned: result.filesScanned,
      filesModified: result.filesModified,
    });

    formatter.result(
      {
        filesScanned: result.filesScanned,
        filesModified: result.filesModified,
        migrations: result.migrationsApplied,
        dryRun: args.dryRun,
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
}

function parseArgv(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    dryRun: false,
    format: 'human',
    verbose: false,
    color: process.stdout.isTTY ?? true,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dry-run' || arg === '--dryRun') {
      result.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      result.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--color') {
      result.color = true;
    } else if (arg === '--no-color') {
      result.color = false;
    } else if (arg.startsWith('--format=')) {
      const format = arg.slice(9);
      if (format === 'json' || format === 'human') {
        result.format = format;
      }
    } else {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        const value = arg.slice(eqIdx + 1);
        assignArg(result, key, value);
      } else if (arg.startsWith('--') && i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        const key = arg.slice(2);
        const value = argv[++i];
        assignArg(result, key, value);
      }
    }
  }

  return result;
}

function assignArg(result: ParsedArgs, key: string, value: string): void {
  switch (key) {
    case 'dir':
      result.dir = value;
      break;
    case 'from':
      result.from = value;
      break;
    case 'to':
      result.to = value;
      break;
    case 'only':
      result.only = value.split(',').map((s) => s.trim()).filter(Boolean);
      break;
  }
}

function printHelp(): void {
  console.log(`
Usage: migrations --from=<version> --to=<version> --dir=<path> [options]

Options:
  --from=<version>   Starting version (exclusive lower bound). e.g. 8.0.0
  --to=<version>     Target version (inclusive upper bound). e.g. 9.0.0
  --dir=<path>       Directory to scan for files to transform (required).
  --only=<id,...>    Comma-separated list of migration IDs to run (optional).
  --dry-run          Show which files would be modified without writing them.
  --format=json      Output results as JSON (default: human-readable).
  --verbose, -v      Show detailed logs and progress information.
  --color            Force color output (default: auto-detect TTY).
  --no-color         Disable color output.
  --help, -h         Show this help message.

Examples:
  # Standard migration
  migrations --from=8.0.0 --to=9.0.0 --dir=./src

  # Dry run with verbose output
  npx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src --dry-run --verbose

  # JSON output for CI/CD integration
  pnpm dlx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src --format=json

  # Run specific migrations only
  migrations --from=8.0.0 --to=9.0.0 --dir=./src --only=rename-prop,rename-attr
`);
}
