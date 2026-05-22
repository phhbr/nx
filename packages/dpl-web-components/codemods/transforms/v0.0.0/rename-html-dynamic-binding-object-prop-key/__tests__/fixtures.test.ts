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

describe('golden: renameHtmlDynamicBindingObjectPropKey — HTML template', () => {
  it('matches golden output', () => {
    goldenTest('template.input.html', 'template.output.html', 'template.html');
  });
});

describe('renameHtmlDynamicBindingObjectPropKey — warn behaviour', () => {
  it('warns when the binding is a non-rewritable expression and mentions the file path', () => {
    const warnings: string[] = [];
    const source = '<dpl-button [buttonConfig]="externalConfig"></dpl-button>';
    const result = transformHtml(source, 'src/app.component.html', (msg) => warnings.push(msg));

    expect(result).toBe(source);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('src/app.component.html');
    expect(warnings[0]).toContain('testInterface');
    expect(warnings[0]).toContain('newProperty');
  });

  it('does not warn when an inline object literal does not mention the key', () => {
    const warnings: string[] = [];
    const source = '<dpl-button [buttonConfig]="{ unrelated: data }"></dpl-button>';
    transformHtml(source, 'src/app.component.html', (msg) => warnings.push(msg));
    expect(warnings).toHaveLength(0);
  });

  it('does not warn when already migrated', () => {
    const warnings: string[] = [];
    const source = '<dpl-button [buttonConfig]="{ newProperty: data }"></dpl-button>';
    transformHtml(source, 'src/app.component.html', (msg) => warnings.push(msg));
    expect(warnings).toHaveLength(0);
  });
});

describe('renameHtmlDynamicBindingObjectPropKey — edge cases', () => {
  it('does not transform unknown file extensions', () => {
    const source = '<dpl-button [buttonConfig]="{ testInterface: x }"></dpl-button>';
    expect(transform(source, 'file.tsx')).toBe(source);
  });

  it('does not transform non-target tags', () => {
    const source = '<other-button [buttonConfig]="{ testInterface: x }"></other-button>';
    expect(transformHtml(source)).toBe(source);
  });
});
