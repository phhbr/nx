export { runMigrations, loadMigrationsFromManifest, selectMigrations } from './runner';
export type { MigrationEntry, RunOptions, RunResult } from './types';

/**
 * CLI entry point. Called from bin/migrations.js with process.argv.slice(2).
 */
export async function runCli(argv: string[]): Promise<void> {
  const args = parseArgv(argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const missing: string[] = [];
  if (!args.dir) missing.push('--dir');
  if (!args.from) missing.push('--from');
  if (!args.to) missing.push('--to');
  if (missing.length > 0) {
    console.error(`Missing required arguments: ${missing.join(', ')}`);
    printHelp();
    process.exit(1);
  }

  try {
    const { runMigrations } = await import('./runner');
    const result = await runMigrations({
      dir: args.dir as string,
      from: args.from as string,
      to: args.to as string,
      dryRun: args.dryRun,
      only: args.only,
    });

    console.log('\n--- Migration Summary ---');
    console.log(`Files scanned:  ${result.filesScanned}`);
    console.log(`Files modified: ${result.filesModified}`);
    for (const m of result.migrationsApplied) {
      console.log(`  ${m.id}: ${m.filesModified} file(s) modified`);
    }
    if (args.dryRun) {
      console.log('\n(dry-run mode: no files were written)');
    }
  } catch (err) {
    console.error('Migration failed:', (err as Error).message);
    process.exit(1);
  }
}

interface ParsedArgs {
  dir?: string;
  from?: string;
  to?: string;
  dryRun: boolean;
  only?: string[];
  help: boolean;
}

function parseArgv(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { dryRun: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dry-run' || arg === '--dryRun') {
      result.dryRun = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }

    const eqIdx = arg.indexOf('=');
    if (eqIdx !== -1) {
      const key = arg.slice(2, eqIdx);
      const value = arg.slice(eqIdx + 1);
      assignArg(result, key, value);
    } else if (
      arg.startsWith('--') &&
      i + 1 < argv.length &&
      !argv[i + 1].startsWith('--')
    ) {
      const key = arg.slice(2);
      const value = argv[++i];
      assignArg(result, key, value);
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
  --from=<version>  Starting version (exclusive lower bound). e.g. 8.0.0
  --to=<version>    Target version (inclusive upper bound). e.g. 9.0.0
  --dir=<path>      Directory to scan for files to transform (required).
  --only=<id,...>   Comma-separated list of migration IDs to run (optional).
  --dry-run         Show which files would be modified without writing them.
  --help, -h        Show this help message.

Examples:
  migrations --from=8.0.0 --to=9.0.0 --dir=./src
  npx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src --dry-run
  pnpm dlx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src
`);
}
