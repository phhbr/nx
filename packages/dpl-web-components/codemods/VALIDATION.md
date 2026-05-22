# Transform Validation & Safety Checks

Automated validation system to ensure codemods are safe, correct, and follow best practices.

## Quick Start

After building codemods, run validation:

```bash
# Standard validation (warnings don't fail)
nx run dpl-web-components:codemods:validate

# Strict mode (warnings are errors)
nx run dpl-web-components:codemods:validate:strict

# Validate a specific transform
nx run dpl-web-components:codemods:validate -- --transform rename-my-prop

# Via npm
pnpm --dir packages/dpl-web-components codemods:validate
pnpm --dir packages/dpl-web-components codemods:validate:strict
```

## What Gets Validated

### 1. Manifest Validation ✅

Checks the `manifest.ts` file for correctness:

- **Version format**: Each transform must have a valid semver version (e.g., `3.0.0`)
- **Transform ID**: Must be kebab-case and unique across all transforms
- **Description**: Non-empty and under 120 characters (warning if longer)
- **File extensions**: Must start with dot and be lowercase (e.g., `.tsx`, `.html`)
- **Transform path**: File must exist at the declared path
- **Duplicate IDs**: No two transforms can have the same ID
- **Version grouping**: Multiple transforms at same version triggers a warning

**Example error:**
```
Entry 2 (my-transform): Invalid ID "MyTransform". Must be kebab-case.
Entry 1 (rename-prop): Transform file not found: /path/to/transforms/v3.0.0/rename-prop/index.ts
```

### 2. Transform Module Validation ✅

Checks the transform implementation for correctness:

- **Required exports**: `transform(source: string, filePath: string) => string`
- **Optional exports**: `transformJsx()` and/or `transformHtml()`
- **Syntax**: No JavaScript syntax errors
- **Function signatures**: Parameters and return types match expectations

**Example error:**
```
Transform: rename-dpl-button-variant
  ❌ Missing required export: function transform(source, filePath)
  ⚠️  No transformJsx or transformHtml functions found. They may be handled in transform().
```

### 3. Fixture Validation ✅

Checks test fixtures for completeness and syntax:

- **Fixture pairs exist**: Each framework (JSX, HTML) should have `.input` and `.output` files
- **Valid syntax**: Input/output files are syntactically valid for their type
- **File format**: `.tsx`, `.jsx`, `.ts`, `.js` for code; `.html`, `.vue` for templates
- **At least one pair**: Transforms should have at least one complete fixture

**Example error:**
```
Fixtures: rename-dpl-button-variant
  ❌ Incomplete fixture pair: component.tsx. Both .input and .output files must exist.
  ⚠️  No complete fixture pairs found. Create at least one pair for testing.
```

### 4. Idempotency Checks (Built into tests) ✅

Ensures transforms can be run multiple times without corrupting output.

- **Identity property**: `transform(transform(source)) === transform(source)`
- **No duplicates**: Running twice should not duplicate changes
- **Stable output**: Same input always produces same output

Best tested via fixture-based tests with golden files.

### 5. Safety Checks (Built into tests) ✅

Prevents common corruption issues:

- **Content preservation**: Transform doesn't delete all content
- **Reasonable deletions**: Doesn't remove more than 50% of file
- **No accidental duplication**: Output shouldn't be 2x the input size
- **Balanced delimiters**: `{`, `[`, `(` are still balanced in output
- **No undefined injection**: Doesn't introduce `undefined` or `null` literals

Example warnings:
```
Safety: Transform deleted more than 50% of file. Review carefully.
Safety: Unbalanced { ... } in output. May indicate corrupt transformation.
```

## Validation Modes

### Standard Mode (Default)

Errors block publication. Warnings are informational.

```bash
nx run dpl-web-components:codemods:validate
# Exit code: 0 (always succeeds, even with warnings)
```

### Strict Mode

Errors AND warnings block publication. Used in CI/CD.

```bash
nx run dpl-web-components:codemods:validate:strict
# Exit code: 1 if any errors or warnings
```

## Running in Your Workflow

### Before Publishing

```bash
# Build codemods
nx run dpl-web-components:codemods:build

# Run tests
nx run dpl-web-components:codemods:test

# Validate (strict for CI/CD)
nx run dpl-web-components:codemods:validate:strict

# If all pass, publish
pnpm publish
```

### In CI/CD Pipeline

Add to your CI config (e.g., GitHub Actions, GitLab CI):

```yaml
- name: Validate codemods
  run: nx run dpl-web-components:codemods:validate:strict
```

This ensures only validated transforms are published.

### Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

nx run dpl-web-components:codemods:build && \
  nx run dpl-web-components:codemods:validate:strict
```

## Validator Details

### ManifestValidator

```typescript
validateManifest(manifest: CodemodEntry[], manifestDir: string): ManifestValidationResult
```

Validates the manifest file structure and entries.

**Checks:**
- Semantic version format
- Kebab-case IDs
- Unique IDs
- Non-empty descriptions
- File extension format
- Transform path exists

### TransformValidator

```typescript
validateTransformModule(transformPath: string): TransformValidationResult
```

Validates a single transform implementation.

**Checks:**
- File exists
- No syntax errors
- Exports `transform()`
- Exports `transformJsx()` or `transformHtml()`
- Function signatures

### FixtureValidator

```typescript
validateFixtures(transformDir: string): FixtureValidationResult
```

Validates test fixtures in `__tests__/fixtures/`.

**Checks:**
- Fixture pairs exist (`.input` + `.output`)
- Valid file syntax
- At least one pair

### IdempotencyValidator

```typescript
validateIdempotency(
  transform: (source, filePath) => string,
  testCases: Array<{ description, input, filePath }>
): IdempotencyValidationResult
```

Test helper to verify transforms are idempotent.

**Usage in tests:**
```typescript
import { validateIdempotency } from '../validators/idempotency-validator';

const testCases = [
  { description: 'basic case', input: '<dpl-button variant="outline" />', filePath: 'test.tsx' },
  { description: 'already migrated', input: '<dpl-button variant="ghost" />', filePath: 'test.tsx' },
];

const result = validateIdempotency(transform, testCases);
expect(result.valid).toBe(true);
```

### SafetyValidator

```typescript
validateSafety(input: string, output: string, filePath: string): SafetyValidationResult
```

Test helper to check for common corruption issues.

**Usage in tests:**
```typescript
import { validateSafety } from '../validators/safety-validator';

const input = originalSource;
const output = transform(input, 'component.tsx');
const result = validateSafety(input, output, 'component.tsx');

expect(result.valid).toBe(true);
expect(result.warnings).toHaveLength(0);
```

## Common Issues & Fixes

### ❌ "Incomplete fixture pair"

**Problem:** Only `.input` file exists, missing `.output` file.

**Fix:** Create the `.output` file with expected transformation result.

```bash
touch __tests__/fixtures/component.output.tsx
```

### ❌ "Invalid syntax in fixture"

**Problem:** Fixture file has syntax errors.

**Fix:** Validate syntax of `.input` and `.output` files.

```bash
# Check TypeScript syntax
tsc --noEmit __tests__/fixtures/component.input.tsx

# Check HTML
htmlhint __tests__/fixtures/template.input.html
```

### ⚠️ "Transform deleted more than 50% of file"

**Problem:** Transform removes too much content (likely a bug).

**Causes:**
- Using `.replace()` without checking return value
- Matching too broad a regex
- Not returning original source for no-op cases

**Fix:**
- Ensure transform returns original source if no match found
- Use more specific regex patterns
- Add guards before destructive operations

### ⚠️ "Missing transformJsx or transformHtml"

**Problem:** Transform doesn't implement JSX or HTML variants.

**Why it's a warning (not error):**
- Some transforms might only handle one format
- The main `transform()` function might handle routing

**Fix:** Either:
1. Implement the missing variant, or
2. Document why it's not needed

```typescript
// ✅ Both variants
export function transformJsx(source: string): string { ... }
export function transformHtml(source: string): string { ... }

// ✅ Or delegate to main transform with format detection
export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) {
    // JSX/TS implementation
  } else if (/\.html$/.test(filePath)) {
    // HTML implementation
  }
  return source;
}
```

## Integration with Generator

When you use `nx generate @designsystem/dpl-web-components:transform`, validators are automatically set up:

1. **Manifest registration** is done by the generator (prevents duplicate IDs)
2. **Fixture templates** are created (pass validation immediately)
3. **TypeScript types** are correct (passes transform validation)
4. **Test boilerplate** is idempotency-safe (passes tests)

Still, run validation after implementing to catch logic errors.

## Advanced Usage

### Validate a Specific Transform

```bash
nx run dpl-web-components:codemods:validate -- --transform rename-my-prop
```

### Custom Validation Script

```typescript
import { validateManifest, validateTransformModule, validateFixtures } from './validators';

const manifest = require('./manifest').default;
const results = {
  manifest: validateManifest(manifest, './'),
  transforms: manifest.map(entry => ({
    id: entry.id,
    module: validateTransformModule(`./transforms/${entry.id}/index.ts`),
    fixtures: validateFixtures(`./transforms/${entry.id}`),
  })),
};

const hasErrors = results.manifest.errors.length > 0 ||
  results.transforms.some(t => t.module.errors.length > 0 || t.fixtures.errors.length > 0);

process.exit(hasErrors ? 1 : 0);
```

## Future Enhancements

- [ ] Auto-fix common issues (e.g., create missing `.output` files)
- [ ] Performance analysis (measure transform execution time)
- [ ] Coverage reports (what code patterns are tested)
- [ ] Integration with ESLint (validate transform code style)
- [ ] Regression detection (compare outputs against previous versions)
- [ ] Framework-specific validation (React vs. Vue vs. Angular)
