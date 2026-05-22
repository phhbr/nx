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

describe('golden: replaceJsxStringAttr — TSX component', () => {
  it('matches golden output', () => {
    goldenTest('component.input.tsx', 'component.output.tsx', 'component.tsx');
  });
});

describe('replaceJsxStringAttr — edge cases', () => {
  it('does not transform unknown file extensions', () => {
    const source = '<DplButton variant="outline" />';
    expect(transform(source, 'file.html')).toBe(source);
  });

  it('is a no-op when the target value is absent', () => {
    const source = '<DplButton variant="solid" />';
    expect(transformJsx(source)).toBe(source);
  });

  it('does not transform non-target elements', () => {
    const source = '<OtherButton variant="outline" />';
    expect(transformJsx(source)).toBe(source);
  });

  it('handles member-expression element names without crashing', () => {
    const source = '<Foo.Bar variant="outline" />';
    expect(transformJsx(source)).toBe(source);
  });

  it('leaves non-variant attributes on target elements untouched', () => {
    const source = '<DplButton className="outline" variant="solid" />';
    const result = transformJsx(source);
    expect(result).toContain('className="outline"');
    expect(result).toContain('variant="solid"');
  });
});
