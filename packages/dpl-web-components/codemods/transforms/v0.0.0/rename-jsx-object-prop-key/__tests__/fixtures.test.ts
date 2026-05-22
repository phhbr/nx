import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from '@jest/globals';
import { transform, transformJsx } from '../index';

const FIXTURES = path.join(__dirname, 'fixtures');
const REGEN = process.env.REGENERATE_FIXTURES === '1';

function goldenTest(inputFile: string, outputFile: string, filepath: string): void {
  const input = fs.readFileSync(path.join(FIXTURES, inputFile), 'utf8');
  const outputPath = path.join(FIXTURES, outputFile);
  const actual = transform(input, filepath);

  if (REGEN) {
    fs.writeFileSync(outputPath, actual, 'utf8');
    expect(actual.length).toBeGreaterThan(0);
  } else {
    const expected = fs.readFileSync(outputPath, 'utf8');
    expect(actual).toBe(expected);
  }
}

describe('golden: renameJsxObjectPropKey — TSX component', () => {
  it('matches golden output', () => {
    goldenTest('component.input.tsx', 'component.output.tsx', 'component.tsx');
  });
});

describe('renameJsxObjectPropKey — warn behaviour', () => {
  it('warns when a non-inline reference cannot be rewritten and mentions the file path', () => {
    const warnings: string[] = [];
    const source = '<DplButton buttonConfig={externalConfig} />';
    const result = transformJsx(source, 'src/component.tsx', (msg) => warnings.push(msg));

    expect(result).toBe(source);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('src/component.tsx');
    expect(warnings[0]).toContain('testInterface');
    expect(warnings[0]).toContain('newProperty');
  });

  it('does not warn when the inline object does not contain the key', () => {
    const warnings: string[] = [];
    const source = '<DplButton buttonConfig={{ unrelated: data }} />';
    transformJsx(source, 'src/component.tsx', (msg) => warnings.push(msg));
    expect(warnings).toHaveLength(0);
  });
});

describe('renameJsxObjectPropKey — edge cases', () => {
  it('does not transform unknown file extensions', () => {
    const source = '<DplButton buttonConfig={{ testInterface: x }} />';
    expect(transform(source, 'file.html')).toBe(source);
  });

  it('does not transform non-target elements', () => {
    const source = '<OtherButton buttonConfig={{ testInterface: x }} />';
    expect(transformJsx(source)).toBe(source);
  });

  it('does not transform member-expression element names', () => {
    const source = '<Foo.Bar buttonConfig={{ testInterface: x }} />';
    expect(transformJsx(source)).toBe(source);
  });
});
