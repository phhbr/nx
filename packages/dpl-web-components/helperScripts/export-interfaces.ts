#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Properly-typed TypeScript script to generate index files that export
 * interfaces from:
 * - src/interfaces/
 * - src/interfaces/events/
 *
 * Notes:
 * - This is an ESM TypeScript module. To run it directly use `tsx`, `ts-node`,
 *   or compile it first. Example: `pnpm exec tsx helperScripts/export-interfaces.ts`.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTERFACES_DIR: string = path.join(__dirname, '..', 'src', 'interfaces');
const EVENTS_DIR: string = path.join(INTERFACES_DIR, 'events');
const OUTPUT_ROOT_INDEX: string = path.join(INTERFACES_DIR, 'index.ts');
const OUTPUT_EVENTS_INDEX: string = path.join(EVENTS_DIR, 'index.ts');

function getTypeScriptFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f: string) => f.endsWith('.ts') && f !== 'index.ts')
    .sort();
}

function writeIfChanged(filePath: string, content: string): boolean {
  const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  if (previous === content) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function generateEventsIndex(): string[] {
  const files: string[] = getTypeScriptFiles(EVENTS_DIR);
  if (!files.length) {
    // If index exists but no files remain, remove it to avoid stale exports
    if (fs.existsSync(OUTPUT_EVENTS_INDEX)) fs.unlinkSync(OUTPUT_EVENTS_INDEX);
    return [];
  }

  const lines: string[] = files.map((file: string) => {
    const name = path.basename(file, '.ts');
    return `export * from './${name}';`;
  });

  const content: string = lines.join('\n') + '\n';
  const changed: boolean = writeIfChanged(OUTPUT_EVENTS_INDEX, content);
  if (changed) console.log(`✓ Wrote ${OUTPUT_EVENTS_INDEX}`);
  else console.log(`✓ ${OUTPUT_EVENTS_INDEX} up-to-date`);
  return files;
}

function generateRootIndex(eventFiles: string[]): void {
  const files: string[] = getTypeScriptFiles(INTERFACES_DIR).filter((f) => f !== 'index.ts');

  const lines: string[] = [];
  for (const file of files) {
    // skip collisions (there shouldn't be a file named 'events.ts')
    if (file === 'events') continue;
    const name = path.basename(file, '.ts');
    lines.push(`export * from './${name}';`);
  }

  if (eventFiles && eventFiles.length) {
    lines.push(`export * from './events';`);
  }

  if (!lines.length) {
    if (fs.existsSync(OUTPUT_ROOT_INDEX)) fs.unlinkSync(OUTPUT_ROOT_INDEX);
    return;
  }

  const content: string = lines.join('\n') + '\n';
  const changed: boolean = writeIfChanged(OUTPUT_ROOT_INDEX, content);
  if (changed) console.log(`✓ Wrote ${OUTPUT_ROOT_INDEX}`);
  else console.log(`✓ ${OUTPUT_ROOT_INDEX} up-to-date`);
}

async function main(): Promise<void> {
  try {
    if (!fs.existsSync(INTERFACES_DIR)) {
      console.warn('Interfaces directory not found:', INTERFACES_DIR);
      return;
    }

    // ensure events dir exists (it's ok if it doesn't)
    if (!fs.existsSync(EVENTS_DIR)) fs.mkdirSync(EVENTS_DIR, { recursive: true });

    const eventFiles: string[] = generateEventsIndex();
    generateRootIndex(eventFiles);

    console.log('Done.');
  } catch (err) {
    console.error('Error generating interface indexes:', err);
    process.exit(1);
  }
}

main();
