/**
 * Golden / fixture-based tests for rename-cell-type-icon-to-status.
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

describe('golden: cell type icon→status — TSX component', () => {
  it('matches golden output', () => {
    goldenTest('component.input.tsx', 'component.output.tsx', 'component.tsx');
  });
});

describe('golden: cell type icon→status — HTML template', () => {
  it('matches golden output', () => {
    goldenTest('template.input.html', 'template.output.html', 'template.html');
  });
});

describe('golden: cell type icon→status — React component with JSX and hooks', () => {
  it('matches golden output', () => {
    goldenTest('react-inline.input.tsx', 'react-inline.output.tsx', 'react-inline.tsx');
  });
});

describe('golden: cell type icon→status — Angular component class', () => {
  it('matches golden output', () => {
    goldenTest('angular-component.input.ts', 'angular-component.output.ts', 'user-table.component.ts');
  });
});

describe('golden: cell type icon→status — Angular HTML template', () => {
  it('matches golden output', () => {
    goldenTest('angular-template.input.html', 'angular-template.output.html', 'user-table.component.html');
  });
});

describe('golden: cell type icon→status — Vue SFC', () => {
  it('matches golden output', () => {
    goldenTest('sfc.input.vue', 'sfc.output.vue', 'status-table.vue');
  });
});
