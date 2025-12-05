#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to generate an index file that exports all interfaces from:
 * - src/interfaces/
 * - src/interfaces/events/
 */

const INTERFACES_DIR: string = path.join(__dirname, '..', 'src', 'interfaces');
const INTERFACES_EVENTS_DIR: string = path.join(INTERFACES_DIR, 'events');
const OUTPUT_FILE: string = path.join(INTERFACES_DIR, 'index.ts');

/**
 * Get all TypeScript files from a directory
 */
function getTypeScriptFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((file: string) => file.endsWith('.ts') && file !== 'index.ts')
    .sort();
}

/**
 * Generate export statements for all interfaces
 */
function generateExports(): string {
  const exports: string[] = [];

  // Export from root interfaces directory
  const interfaceFiles = getTypeScriptFiles(INTERFACES_DIR);
  interfaceFiles.forEach((file: string) => {
    const exportName = path.basename(file, '.ts');
    exports.push(`export * from './${exportName}';`);
  });

  // Export from events subdirectory
  const eventFiles = getTypeScriptFiles(INTERFACES_EVENTS_DIR);
  eventFiles.forEach((file: string) => {
    const exportName = path.basename(file, '.ts');
    exports.push(`export * from './events/${exportName}';`);
  });

  return exports.join('\n');
}

/**
 * Main execution
 */
function main(): void {
  try {
    const exports = generateExports();

    if (!exports) {
      console.warn('No interfaces found to export');
      return;
    }

    fs.writeFileSync(OUTPUT_FILE, exports + '\n', 'utf8');
    console.log(`✓ Generated interface exports at: ${OUTPUT_FILE}`);
    console.log(`  Interfaces found: ${exports.split('\n').length}`);
  } catch (error) {
    console.error('Error generating interface exports:', error);
    process.exit(1);
  }
}

main();
