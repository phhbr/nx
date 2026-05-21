/**
 * Golden / fixture-based tests for rename-dpl-button-config-test-interface-to-new-property.
 *
 * Each test reads a realistic multi-case input file, runs the transform, then
 * compares the result to the stored golden output file.
 *
 * To regenerate golden files after an intentional behaviour change:
 *
 *   REGENERATE_FIXTURES=1 pnpm --dir packages/dpl-web-components codemods:test
 *
 * Review the diff of the regenerated output files before committing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { transform } from '../index';

const FIXTURES = path.join(__dirname, 'fixtures');
const REGEN = process.env.REGENERATE_FIXTURES === '1';

// Suppress expected console.warn calls (variable references that can't be auto-migrated).
let warnSpy: jest.SpyInstance;
beforeEach(() => { warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { warnSpy.mockRestore(); });

function goldenTest(inputFile: string, outputFile: string, filepath: string): void {
  const inputPath = path.join(FIXTURES, inputFile);
  const outputPath = path.join(FIXTURES, outputFile);
  const input = fs.readFileSync(inputPath, 'utf8');
  const actual = transform(input, filepath);

  if (REGEN) {
    fs.writeFileSync(outputPath, actual, 'utf8');
    expect(actual.length).toBeGreaterThan(0);
  } else {
    if (!fs.existsSync(outputPath)) {
      throw new Error(
        `Golden file not found: ${outputPath}\nRun with REGENERATE_FIXTURES=1 to generate it.`,
      );
    }
    const expected = fs.readFileSync(outputPath, 'utf8');
    expect(actual).toBe(expected);
  }
}

describe('golden: buttonConfig rename — TSX component', () => {
  it('matches golden output', () => {
    goldenTest('component.input.tsx', 'component.output.tsx', 'component.tsx');
  });
});

describe('golden: buttonConfig rename — HTML template', () => {
  it('matches golden output', () => {
    goldenTest('template.input.html', 'template.output.html', 'template.html');
  });
});
