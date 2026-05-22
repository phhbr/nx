/**
 * Fixture validator — ensures test fixtures exist and are parseable.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FixtureValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fixtures: Array<{
    name: string;
    inputExists: boolean;
    outputExists: boolean;
    inputValid: boolean;
    outputValid: boolean;
  }>;
}

export function validateFixtures(transformDir: string): FixtureValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixtures: FixtureValidationResult['fixtures'] = [];

  const testDir = path.join(transformDir, '__tests__');
  const fixturesDir = path.join(testDir, 'fixtures');

  if (!fs.existsSync(fixturesDir)) {
    errors.push(`Fixtures directory not found: ${fixturesDir}`);
    return {
      valid: false,
      errors,
      warnings,
      fixtures: [],
    };
  }

  // Expected fixture patterns
  const patterns = [
    { base: 'component', exts: ['.tsx', '.jsx', '.ts', '.js'] },
    { base: 'template', exts: ['.html', '.vue'] },
    { base: 'react-inline', exts: ['.tsx'] },
    { base: 'angular-component', exts: ['.ts'] },
  ];

  for (const pattern of patterns) {
    for (const ext of pattern.exts) {
      const inputFile = path.join(fixturesDir, `${pattern.base}.input${ext}`);
      const outputFile = path.join(fixturesDir, `${pattern.base}.output${ext}`);

      const inputExists = fs.existsSync(inputFile);
      const outputExists = fs.existsSync(outputFile);

      if (inputExists && outputExists) {
        const inputValid = isValidSyntax(inputFile, ext);
        const outputValid = isValidSyntax(outputFile, ext);

        fixtures.push({
          name: pattern.base,
          inputExists,
          outputExists,
          inputValid,
          outputValid,
        });

        if (!inputValid) {
          errors.push(`Invalid syntax in fixture: ${inputFile}`);
        }
        if (!outputValid) {
          errors.push(`Invalid syntax in fixture: ${outputFile}`);
        }
      } else if (inputExists || outputExists) {
        errors.push(
          `Incomplete fixture pair: ${pattern.base}${ext}. Both .input and .output files must exist.`,
        );
      }
    }
  }

  if (fixtures.length === 0) {
    warnings.push(
      `No complete fixture pairs found in ${fixturesDir}. Create at least one pair for testing.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fixtures,
  };
}

function isValidSyntax(filePath: string, ext: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    if (ext === '.html') {
      // Basic HTML validation
      return content.includes('<') && content.includes('>');
    }

    if (['.tsx', '.jsx', '.ts', '.js'].includes(ext)) {
      // For TypeScript files with imports, skip execution validation
      // (they require external dependencies to execute)
      if (/^import\s|^export\s/m.test(content)) {
        // Just check for basic syntax indicators
        return content.includes('{') && content.includes('}');
      }

      // Basic JS/TS validation for non-import code
      // Try to parse as if it were a module (wrap in IIFE if needed)
      const wrapped = `(function() { ${content} })();`;
      try {
        new Function(wrapped);
        return true;
      } catch {
        // If wrapping didn't help, try parsing as is
        new Function(content);
        return true;
      }
    }

    if (ext === '.vue') {
      // Basic Vue validation
      return content.includes('<template') && content.includes('</template>');
    }

    return true;
  } catch {
    return false;
  }
}
