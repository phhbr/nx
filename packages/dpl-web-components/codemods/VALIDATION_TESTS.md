# Using Safety & Validation Checks in Transform Tests

Guide for developers implementing transforms to use built-in validation utilities.

## Safety Validation in Tests

Use `validateSafety()` to catch corruption issues before they reach production.

### Basic Usage

```typescript
import { validateSafety } from '../validators/safety-validator';
import { transform } from './index';

describe('my-transform', () => {
  it('transform is safe — preserves structure', () => {
    const input = `<dpl-button variant="outline">Click me</dpl-button>`;
    const output = transform(input, 'component.tsx');

    const result = validateSafety(input, output, 'component.tsx');

    // Warnings are okay (they're informational)
    // Errors mean the transform corrupted the file
    expect(result.errors).toHaveLength(0);
  });
});
```

### What Gets Checked

- ✅ **Content not deleted** → No warning if output size is reasonable
- ⚠️ **Excessive deletions** → Warning if >50% of content removed
- ⚠️ **Unbalanced delimiters** → Warning if `{`, `[`, `(` become unbalanced
- ⚠️ **Duplicates** → Warning if output is 2x input size
- ❌ **All content deleted** → Error if output is empty but input wasn't

### Example: Checking Structure Integrity

```typescript
describe('safety checks', () => {
  it('preserves balanced brackets', () => {
    const input = `const obj = { a: { b: 'value' }, c: [1, 2] };`;
    const output = transform(input, 'index.ts');

    const result = validateSafety(input, output, 'index.ts');
    expect(result.errors).toEqual([]);
    expect(result.warnings).not.toContainEqual(
      expect.stringMatching(/Unbalanced/)
    );
  });

  it('does not introduce undefined', () => {
    const input = `const value = getSomeValue();`;
    const output = transform(input, 'index.ts');

    const result = validateSafety(input, output, 'index.ts');
    // If output has 'undefined' but input doesn't, it's likely a corruption
    expect(result.warnings).not.toContainEqual(
      expect.stringMatching(/undefined/)
    );
  });
});
```

## Idempotency Validation in Tests

Use `validateIdempotency()` to verify transforms produce stable output.

### Basic Usage

```typescript
import { validateIdempotency } from '../validators/idempotency-validator';
import { transform } from './index';

describe('idempotency', () => {
  it('running twice produces identical output', () => {
    const testCases = [
      {
        description: 'basic prop rename',
        input: '<dpl-button old-prop="value" />',
        filePath: 'component.tsx',
      },
      {
        description: 'already migrated (no-op)',
        input: '<dpl-button new-prop="value" />',
        filePath: 'component.tsx',
      },
      {
        description: 'dynamic prop (skipped)',
        input: '<dpl-button old-prop={someVar} />',
        filePath: 'component.tsx',
      },
    ];

    const result = validateIdempotency(transform, testCases);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

### What Happens

```
Input:  <dpl-button old-prop="x" />
Run 1:  <dpl-button new-prop="x" />
Run 2:  <dpl-button new-prop="x" />  ✅ Same as Run 1 = IDEMPOTENT
```

vs.

```
Input:  <dpl-button new-prop="x" />
Run 1:  <dpl-button new-prop="x" />
Run 2:  <dpl-button new-prop="x" />  ✅ No change = IDEMPOTENT
```

### Best Practices

**Test the no-op case:**
```typescript
{
  description: 'already migrated (no-op)',
  input: '<dpl-button variant="ghost" />',  // Already has new value
  filePath: 'component.tsx',
},
```

**Test edge cases:**
```typescript
{
  description: 'dynamic binding (should be skipped)',
  input: '<dpl-button variant={someVar} />',
  filePath: 'component.tsx',
},
{
  description: 'multiple occurrences',
  input: `
    <dpl-button variant="outline" />
    <dpl-button variant="outline" />
  `,
  filePath: 'component.tsx',
},
```

## Full Example: Comprehensive Transform Tests

```typescript
import { validateSafety } from '../validators/safety-validator';
import { validateIdempotency } from '../validators/idempotency-validator';
import { transform } from './index';

describe('rename-dpl-button-variant-outline-to-ghost', () => {
  // ========== Idempotency Tests ==========
  describe('idempotency', () => {
    it('is idempotent — running twice produces identical output', () => {
      const testCases = [
        {
          description: 'basic rename',
          input: '<dpl-button variant="outline">Click</dpl-button>',
          filePath: 'component.tsx',
        },
        {
          description: 'already migrated (no-op)',
          input: '<dpl-button variant="ghost">Click</dpl-button>',
          filePath: 'component.tsx',
        },
        {
          description: 'double-quoted',
          input: '<dpl-button variant="outline" />',
          filePath: 'component.tsx',
        },
        {
          description: 'dynamic binding (skipped)',
          input: '<dpl-button variant={myVar} />',
          filePath: 'component.tsx',
        },
        {
          description: 'multiple on same line',
          input: '<dpl-button variant="outline" /> <dpl-button variant="outline" />',
          filePath: 'component.tsx',
        },
      ];

      const result = validateIdempotency(transform, testCases);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ========== Safety Tests ==========
  describe('safety', () => {
    it('does not corrupt JSX structure', () => {
      const input = '<dpl-button variant="outline">{ nested: true }</dpl-button>';
      const output = transform(input, 'component.tsx');

      const result = validateSafety(input, output, 'component.tsx');
      expect(result.errors).toHaveLength(0);
    });

    it('does not corrupt HTML templates', () => {
      const input = `<table>
        <tr><td><dpl-button variant="outline" /></td></tr>
      </table>`;
      const output = transform(input, 'template.html');

      const result = validateSafety(input, output, 'template.html');
      expect(result.errors).toHaveLength(0);
    });

    it('preserves content integrity', () => {
      const inputs = [
        '<!-- comment --> <dpl-button variant="outline" />',
        "String with 'quotes' and \"double\" <dpl-button variant=\"outline\" />",
        '<dpl-button variant="outline">Content</dpl-button>',
      ];

      for (const input of inputs) {
        const output = transform(input, 'test.tsx');
        const result = validateSafety(input, output, 'test.tsx');
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  // ========== Functional Tests ==========
  describe('functionality', () => {
    it('renames outline to ghost', () => {
      const input = '<dpl-button variant="outline" />';
      const output = transform(input, 'component.tsx');
      expect(output).toContain('variant="ghost"');
    });

    it('leaves other variants unchanged', () => {
      const input = '<dpl-button variant="primary" />';
      const output = transform(input, 'component.tsx');
      expect(output).toBe(input);
    });
  });
});
```

## Integration with Jest

All validators work with Jest:

```typescript
// In jest.config.cjs
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};
```

Run tests:

```bash
# Run all tests (including safety/idempotency)
nx run dpl-web-components:codemods:test

# Run specific test file
nx run dpl-web-components:codemods:test -- rename-button-variant

# Watch mode
nx run dpl-web-components:codemods:test -- --watch
```

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Validate Transforms

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: nx run dpl-web-components:codemods:build
      - run: nx run dpl-web-components:codemods:test
      - run: nx run dpl-web-components:codemods:validate:strict
```

## Common Patterns

### Pattern: Regex + Safety Check

```typescript
function transformJsx(source: string): string {
  return source.replace(
    /<dpl-button[^>]*variant="outline"[^>]*>/g,
    (match) => match.replace('variant="outline"', 'variant="ghost"'),
  );
}

// Then test it:
it('is safe', () => {
  const input = '<dpl-button variant="outline" />';
  const output = transformJsx(input);
  const result = validateSafety(input, output, 'test.tsx');
  expect(result.errors).toHaveLength(0);
});
```

### Pattern: Multi-format with Type Guards

```typescript
export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) {
    return transformJsx(source);
  }
  if (/\.html$/.test(filePath)) {
    return transformHtml(source);
  }
  return source;
}

// Test both:
it('transforms JSX', () => {
  const input = '<DplButton variant="outline" />';
  const output = transform(input, 'component.tsx');
  expect(validateIdempotency(transform, [
    { description: 'JSX', input, filePath: 'component.tsx' }
  ]).valid).toBe(true);
});

it('transforms HTML', () => {
  const input = '<dpl-button variant="outline" />';
  const output = transform(input, 'template.html');
  expect(validateIdempotency(transform, [
    { description: 'HTML', input, filePath: 'template.html' }
  ]).valid).toBe(true);
});
```

## Tips & Tricks

**Always test the no-op case:**
```typescript
{
  description: 'no-op: already migrated',
  input: sourceWithNewValue,
  filePath: 'test.tsx',
},
```

**Test partial matches:**
```typescript
{
  description: 'partial match with other props',
  input: '<dpl-button variant="outline" size="large" />',
  filePath: 'test.tsx',
},
```

**Document skipped cases:**
```typescript
// Dynamic bindings are intentionally skipped
{
  description: 'dynamic: computed value (intentionally skipped)',
  input: '<dpl-button variant={getVariant()} />',
  filePath: 'test.tsx',
},
```

## Troubleshooting

**Idempotency failing?**
- Check that `transform()` returns the original source if there's no match
- Ensure regex doesn't create new matches on subsequent runs
- Test with the no-op case

**Safety warning: Unbalanced delimiters?**
- Likely a regex that removes/adds delimiters incorrectly
- Check opening `{` and closing `}` counts
- Use recast for AST-based transforms instead of regex for complex code

**Fixture tests failing?**
- Ensure `.input` and `.output` files both exist
- Check for syntax errors in fixtures (use `tsc` to validate)
- Regenerate with `REGENERATE_FIXTURES=1`
