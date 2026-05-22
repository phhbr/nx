import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from '@jest/globals';
import { transform, transformHtml } from '../index';

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

describe('golden: replaceHtmlAttr — HTML template', () => {
  it('matches golden output', () => {
    goldenTest('template.input.html', 'template.output.html', 'template.html');
  });
});

describe('replaceHtmlAttr — edge cases', () => {
  it('does not transform unknown file extensions', () => {
    const source = '<dpl-button variant="outline" />';
    expect(transform(source, 'file.tsx')).toBe(source);
    expect(transform(source, 'file.ts')).toBe(source);
  });

  it('is a no-op when the target value is absent', () => {
    const source = '<dpl-button variant="solid" />';
    expect(transformHtml(source)).toBe(source);
  });

  it('does not replace partial matches within a longer value', () => {
    const source = '<dpl-button variant="outline-thick" />';
    expect(transformHtml(source)).toBe(source);
  });

  it('leaves the source unchanged when no dpl-button is present', () => {
    const source = '<other-button variant="outline" />';
    expect(transformHtml(source)).toBe(source);
  });

  it('handles multiple dpl-button elements in one source', () => {
    const source = [
      '<dpl-button variant="outline" />',
      '<dpl-button variant="solid" />',
      '<dpl-button variant="outline">Go</dpl-button>',
    ].join('\n');
    const result = transformHtml(source);
    expect(result).toContain('variant="ghost"');
    expect(result).not.toContain('variant="outline"');
    expect(result).toContain('variant="solid"');
  });
});
