# Transform Validation System — Implementation Summary

Complete validation & safety checking system for codemods.

## What Was Created

### 1. Validator Modules (`codemods/validators/`)

Five focused validators that can be imported and used independently:

#### **manifest-validator.ts**
- Validates semver versions
- Checks kebab-case IDs (unique)
- Verifies descriptions
- Validates file extensions
- Confirms transform files exist
- Detects duplicate IDs and version grouping

#### **transform-validator.ts**
- Checks for required exports (`transform()`)
- Validates function signatures
- Detects syntax errors
- Checks optional exports (`transformJsx()`, `transformHtml()`)

#### **fixture-validator.ts**
- Finds and validates test fixtures
- Checks fixture pairs (input + output) exist
- Validates syntax of fixture files
- Warns if no fixtures found

#### **idempotency-validator.ts**
- Test helper to verify transforms are idempotent
- Runs transform twice and compares output
- Reports which test cases failed
- Usage: `validateIdempotency(transform, testCases)`

#### **safety-validator.ts**
- Test helper to detect code corruption
- Checks for excessive deletions (>50%)
- Validates balanced delimiters
- Detects unintended duplication
- Usage: `validateSafety(input, output, filePath)`

### 2. Validation CLI (`codemods/validate.ts`)

Command-line tool that orchestrates all validators:

```bash
node codemods/dist/validate.js                    # Standard validation
node codemods/dist/validate.js --strict           # Warnings fail
node codemods/dist/validate.js --transform <id>   # Specific transform
```

**Features:**
- Runs all validators on all transforms
- Formatted output with icons (✅ ❌ ⚠️)
- Exit codes for CI/CD integration
- Can filter to specific transforms

### 3. Build Targets (project.json & package.json)

**Nx targets:**
```bash
nx run dpl-web-components:codemods:validate
nx run dpl-web-components:codemods:validate:strict
```

**npm scripts:**
```bash
pnpm --dir packages/dpl-web-components codemods:validate
pnpm --dir packages/dpl-web-components codemods:validate:strict
```

### 4. Documentation

#### **VALIDATION.md**
Complete guide to validation system:
- Quick start commands
- What each validator checks
- Common issues and fixes
- Integration with CI/CD
- API reference for each validator
- Advanced usage examples

#### **VALIDATION_TESTS.md**
How-to guide for developers:
- Using safety checks in tests
- Using idempotency checks in tests
- Best practices
- Full example tests
- Jest integration
- CI/CD integration
- Common patterns
- Troubleshooting

### 5. Integration Points

- **TypeScript config** (`tsconfig.cjs.json`): Includes validators in build
- **Package.json**: Added validation scripts
- **Project.json**: Added validation targets
- **Main README**: Updated to mention validation
- **Manifest references**: Automatic validation during generator

## How It Works

### Typical Workflow

```
1. Create transform
   └─ Use generator: nx generate @designsystem/dpl-web-components:transform

2. Implement transform logic
   └─ Edit codemods/transforms/vX.Y.Z/<id>/index.ts

3. Create test fixtures
   └─ Edit codemods/transforms/vX.Y.Z/<id>/__tests__/fixtures/

4. Run tests
   └─ nx run dpl-web-components:codemods:test

5. Validate (standard)
   └─ nx run dpl-web-components:codemods:validate
   └─ Review warnings, fix if needed

6. Validate (strict for CI/CD)
   └─ nx run dpl-web-components:codemods:validate:strict
   └─ Must pass all checks before publishing

7. Publish
   └─ pnpm publish
```

### Validation Flow

```
┌─ Load manifest.ts
│
├─ Validate Manifest
│  ├─ Version format (semver)
│  ├─ ID format (kebab-case, unique)
│  ├─ Description (non-empty, <120 chars)
│  ├─ Extensions (valid format)
│  └─ Transform paths (files exist)
│
├─ For each transform:
│  ├─ Validate Transform Module
│  │  ├─ File exists
│  │  ├─ Syntax valid
│  │  ├─ Exports transform()
│  │  └─ Exports transformJsx/Html
│  │
│  └─ Validate Fixtures
│     ├─ Fixture pairs exist
│     ├─ File syntax valid
│     └─ At least one pair
│
└─ Report results
   ├─ Errors (always shown)
   ├─ Warnings (shown, fail in --strict)
   └─ Exit code (0=pass, 1=fail in strict)
```

## Output Examples

### Standard Mode

```
🔍 Validating codemods...

1️⃣  Manifest validation...
  ✅ Manifest
     ✅ 2 transforms registered
     ⚠️  Multiple transforms at version 2.0.0

2️⃣  Transform validation...
  ✅ Transform: rename-cell-type-icon-to-status
  ✅   Fixtures: rename-cell-type-icon-to-status
     ✅ 3 fixture pairs found

============================================================
✅ All codemods passed validation!
```

### With Errors

```
1️⃣  Manifest validation...
  ❌ Manifest
     ❌ Entry 2 (my-transform): Invalid ID "MyTransform". Must be kebab-case.
     ❌ Entry 1 (rename-prop): Transform file not found: .../index.ts

2️⃣  Transform validation...
  ❌ Transform: rename-dpl-button-variant
     ❌ Missing required export: function transform(source, filePath)
     ⚠️  No transformJsx or transformHtml functions found.

  ❌   Fixtures: rename-dpl-button-variant
     ❌ Incomplete fixture pair: component.tsx. Both .input and .output files must exist.

============================================================
❌ Validation failed. Fix the errors above before publishing.
```

## Using in Tests

### Idempotency Tests

```typescript
import { validateIdempotency } from '../validators/idempotency-validator';

it('is idempotent', () => {
  const result = validateIdempotency(transform, [
    { description: 'basic', input: '...', filePath: 'test.tsx' },
  ]);
  expect(result.valid).toBe(true);
});
```

### Safety Tests

```typescript
import { validateSafety } from '../validators/safety-validator';

it('is safe', () => {
  const input = '<dpl-button variant="outline" />';
  const output = transform(input, 'test.tsx');
  const result = validateSafety(input, output, 'test.tsx');
  expect(result.errors).toHaveLength(0);
});
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Build codemods
  run: nx run dpl-web-components:codemods:build

- name: Test codemods
  run: nx run dpl-web-components:codemods:test

- name: Validate transforms (strict)
  run: nx run dpl-web-components:codemods:validate:strict
```

### GitLab CI

```yaml
validate:
  script:
    - nx run dpl-web-components:codemods:build
    - nx run dpl-web-components:codemods:test
    - nx run dpl-web-components:codemods:validate:strict
```

## Benefits

✅ **Prevents broken transforms** — Manifest and syntax validation catch issues early
✅ **Ensures correctness** — Fixture validation guarantees transforms work
✅ **Guarantees safety** — Safety checks prevent code corruption
✅ **Enforces best practices** — Idempotency validation ensures stability
✅ **CI/CD ready** — Strict mode integrates seamlessly with pipelines
✅ **Developer friendly** — Clear error messages and actionable fixes
✅ **Extensible** — Individual validators can be used in custom tooling

## File Structure

```
packages/dpl-web-components/codemods/
├── VALIDATION.md                    # Full documentation
├── VALIDATION_TESTS.md              # Testing guide
├── validate.ts                      # Main CLI tool
├── tsconfig.cjs.json               # Updated to include validators
└── validators/
    ├── index.ts                     # Exports all validators
    ├── manifest-validator.ts
    ├── transform-validator.ts
    ├── fixture-validator.ts
    ├── idempotency-validator.ts
    └── safety-validator.ts
```

## Usage Summary

| Task | Command |
|------|---------|
| Validate all transforms | `nx run dpl-web-components:codemods:validate` |
| Strict validation (CI/CD) | `nx run dpl-web-components:codemods:validate:strict` |
| Validate specific transform | `nx run dpl-web-components:codemods:validate -- --transform <id>` |
| View help | `node codemods/dist/validate.js --help` |
| Use in tests | `import { validateIdempotency, validateSafety } from './validators'` |

## Next Steps

1. **Review validation rules** — See [VALIDATION.md](../codemods/VALIDATION.md)
2. **Check test patterns** — See [VALIDATION_TESTS.md](../codemods/VALIDATION_TESTS.md)
3. **Add to CI/CD** — Integrate `codemods:validate:strict` into pipeline
4. **Document transforms** — Add validation notes to transform READMEs
5. **Monitor quality** — Track validation failures in your repository

## Related Features

- **Transform Generator** — `nx generate @designsystem/dpl-web-components:transform`
- **Enhanced CLI** — Future: JSON output, verbose logging, performance metrics
- **Transform Utilities** — Shared JSX/HTML transformation helpers
