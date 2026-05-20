/**
 * Direct per-transform CLI runner.
 *
 * Usage (after codemods:build):
 *   node codemods/dist/cli.js --transform <id> --dir <path> [--dry-run]
 *
 * Or via Nx target (passes args through):
 *   nx run dpl-web-components:codemods:run -- --transform rename-dpl-button-variant-outline-to-ghost --dir ./src
 *   nx run dpl-web-components:codemods:run -- --transform rename-dpl-button-variant-outline-to-ghost --dir ./src --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import manifest from './manifest';

interface CliArgs {
  transform?: string;
  dir?: string;
  dryRun: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = { dryRun: false, help: false };

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
      if (key === 'transform') result.transform = value;
      if (key === 'dir') result.dir = value;
    } else if (arg.startsWith('--') && i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[++i];
      if (key === 'transform') result.transform = value;
      if (key === 'dir') result.dir = value;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
Usage: node codemods/dist/cli.js --transform <id> --dir <path> [--dry-run]

Options:
  --transform <id>  ID of the codemod to run (see manifest.ts for available IDs).
  --dir <path>      Directory to scan for files to transform.
  --dry-run         Print which files would be modified without writing them.
  --help, -h        Show this help.

Available transforms:
${manifest.map((m) => `  ${m.id}  (v${m.version})  — ${m.description}`).join('\n')}

Examples:
  node codemods/dist/cli.js --transform rename-dpl-button-variant-outline-to-ghost --dir ../../apps/my-app/src
  node codemods/dist/cli.js --transform rename-dpl-button-variant-outline-to-ghost --dir ./src --dry-run
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

  if (args.help || !args.transform || !args.dir) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const entry = manifest.find((m) => m.id === args.transform);
  if (!entry) {
    console.error(`Unknown transform: "${args.transform}"`);
    console.error(`Available: ${manifest.map((m) => m.id).join(', ')}`);
    process.exit(1);
  }

  // The transform module path is relative to this manifest; after compilation
  // both are in codemods/dist/ so the path resolves correctly.
  const transformModule = require(path.resolve(__dirname, entry.transformPath)) as {
    transform: (source: string, filePath: string) => string;
  };

  const extSet = new Set(entry.fileExtensions);
  const files = walkDir(args.dir, extSet);

  let filesModified = 0;

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const transformed = transformModule.transform(original, filePath);

    if (transformed !== original) {
      filesModified++;
      if (args.dryRun) {
        console.log(`[dry-run] Would modify: ${filePath}`);
      } else {
        fs.writeFileSync(filePath, transformed, 'utf8');
        console.log(`Modified: ${filePath}`);
      }
    }
  }

  console.log(`\n--- ${entry.id} ---`);
  console.log(`Files scanned:  ${files.length}`);
  console.log(`Files modified: ${filesModified}`);
  if (args.dryRun) console.log('(dry-run: no files were written)');
}

main().catch((err) => {
  console.error('Error:', (err as Error).message);
  process.exit(1);
});
