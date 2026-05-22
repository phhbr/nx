/**
 * Enhanced codemods CLI with JSON output and verbose logging.
 *
 * Usage (after codemods:build):
 *   node codemods/dist/cli.js --transform <id> --dir <path> [--dry-run]
 *   node codemods/dist/cli.js --transform <id> --dir <path> --format=json --verbose
 *
 * Or via Nx target:
 *   nx run dpl-web-components:codemods:run -- --transform <id> --dir ./src
 *   nx run dpl-web-components:codemods:run -- --transform <id> --dir ./src --format=json --verbose
 */

import * as fs from 'fs';
import * as path from 'path';
import manifest from './manifest';
import { Formatter } from './cli-formatter';

interface CliArgs {
  transform?: string;
  dir?: string;
  dryRun: boolean;
  format: 'human' | 'json';
  verbose: boolean;
  color: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {
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
        if (key === 'transform') result.transform = value;
        if (key === 'dir') result.dir = value;
      } else if (arg.startsWith('--') && i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        const key = arg.slice(2);
        const value = argv[++i];
        if (key === 'transform') result.transform = value;
        if (key === 'dir') result.dir = value;
      }
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Usage: node codemods/dist/cli.js --transform <id> --dir <path> [options]

Options:
  --transform <id>  ID of the codemod to run (see available below).
  --dir <path>      Directory to scan for files to transform (required).
  --dry-run         Print which files would be modified without writing them.
  --format=json     Output results as JSON (default: human-readable).
  --verbose, -v     Show detailed logs and progress information.
  --color           Force color output (default: auto-detect TTY).
  --no-color        Disable color output.
  --help, -h        Show this help.

Available transforms:
${manifest.map((m) => `  ${m.id}  (v${m.version})  — ${m.description}`).join('\n')}

Examples:
  # Run a single transform
  node codemods/dist/cli.js --transform rename-dpl-button-variant-outline-to-ghost --dir ./src

  # Dry run with verbose output
  node codemods/dist/cli.js --transform rename-dpl-button-variant-outline-to-ghost --dir ./src --dry-run --verbose

  # JSON output for CI/CD integration
  node codemods/dist/cli.js --transform rename-dpl-button-variant-outline-to-ghost --dir ./src --format=json
`);
}

function walkDir(dir: string, exts: Set<string>): string[] {
  const results: string[] = [];

  function walk(current: string): void {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1);
        if (exts.has(ext)) results.push(full);
      }
    }
  }

  walk(path.resolve(dir));
  return results;
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
    if (!args.transform || !args.dir) {
      const missing: string[] = [];
      if (!args.transform) missing.push('--transform');
      if (!args.dir) missing.push('--dir');
      formatter.error(`Missing required arguments: ${missing.join(', ')}`);
      if (args.format !== 'json') {
        printHelp();
      }
      process.exit(1);
    }

    const entry = manifest.find((m) => m.id === args.transform);
    if (!entry) {
      formatter.error(`Unknown transform: "${args.transform}"`);
      formatter.debug('Available transforms:', {
        transforms: manifest.map((m) => m.id),
      });
      process.exit(1);
    }

    formatter.debug('Starting codemod', {
      transform: args.transform,
      dir: args.dir,
      dryRun: args.dryRun,
      description: entry.description,
      extensions: entry.fileExtensions,
    });

    // The transform module path is relative to this manifest; after compilation
    // both are in codemods/dist/ so the path resolves correctly.
    const transformModule = require(path.resolve(__dirname, entry.transformPath)) as {
      transform: (source: string, filePath: string) => string;
    };

    formatter.info('Scanning files...');
    const startTime = Date.now();

    const extSet = new Set(entry.fileExtensions);
    const files = walkDir(args.dir, extSet);

    formatter.debug(`Found ${files.length} matching files`);

    let filesModified = 0;
    const modifiedFiles: string[] = [];

    for (const filePath of files) {
      const original = fs.readFileSync(filePath, 'utf8');
      const transformed = transformModule.transform(original, filePath);

      if (transformed !== original) {
        filesModified++;
        modifiedFiles.push(filePath);

        if (args.dryRun) {
          formatter.info(`[dry-run] Would modify: ${filePath}`);
        } else {
          fs.writeFileSync(filePath, transformed, 'utf8');
          formatter.info(`Modified: ${filePath}`);
        }
      }
    }

    const duration = Date.now() - startTime;

    formatter.result(
      {
        transform: entry.id,
        description: entry.description,
        filesScanned: files.length,
        filesModified,
        modifiedFiles: args.format === 'json' ? modifiedFiles : undefined,
        dryRun: args.dryRun,
      },
      duration,
    );

    process.exit(filesModified > 0 ? 0 : 1);
  } catch (err) {
    formatter.error((err as Error).message, {
      stack: (err as Error).stack,
    });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', (err as Error).message);
  process.exit(1);
});
