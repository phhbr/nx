# Codemods — Internal Developer Guide

Automated migration infrastructure for `@designsystem/dpl-web-components`. This document is for contributors adding or maintaining codemods. For consumer usage, see the [`@designsystem/migrations` README](../../migrations/README.md).

## What lives where

- `packages/dpl-web-components/codemods/` contains the migration payload: the manifest, individual transform implementations, shared utilities, and tests.
- `packages/migrations/` contains the CLI/runtime that discovers those transforms and applies them to a consumer project.
- The codemods are published from the web-components package so each breaking change ships alongside the component version that introduced it.

---

## Registered migrations

| Version | ID | File types | Description |
| --- | --- | --- | --- |
| v2.0.0 | `rename-cell-type-icon-to-status` | ts, tsx, js, jsx, html, vue | Renames CellType "icon" → "status" in Cell object literals |

---

## Validation & Safety

All transforms are validated before publication to ensure:

- **Correctness** — Transforms export required functions with proper signatures
- **Safety** — No corruption of code (balanced delimiters, no data loss)
- **Idempotency** — Running twice produces same result
- **Completeness** — Test fixtures exist and are valid

Run validation:

```bash
# Build first
nx run dpl-web-components:codemods:build

# Standard validation (warnings don't fail)
nx run dpl-web-components:codemods:validate

# Strict mode (warnings are errors, used in CI/CD)
nx run dpl-web-components:codemods:validate:strict
```

For full details, see [VALIDATION.md](./VALIDATION.md).

---

## Architecture

Two packages work together to deliver codemods to consumers:

```mermaid
flowchart TD
    subgraph dpl["packages/dpl-web-components"]
        direction TB
        SRC["src/components/\n(Stencil source)"]
        STENCIL["stencil build"]
        COMP_DIST["dist/\npublished component code"]

        CM_SRC["codemods/\nmanifest.ts + transforms/ + utils/"]
        CM_TSC["tsc -p codemods/tsconfig.cjs.json"]
        CM_DIST["codemods/dist/\npublished codemods CJS"]

        SRC --> STENCIL --> COMP_DIST
        CM_SRC --> CM_TSC --> CM_DIST
    end

    subgraph mig["packages/migrations"]
        direction TB
        RUNNER_SRC["src/runner.ts\nsrc/index.ts"]
        RUNNER_DIST["dist/index.js\ndist/runner.js"]
        BIN["bin/migrations.js\n(static CJS shim)"]

        RUNNER_SRC --> RUNNER_DIST
        BIN --> RUNNER_DIST
    end

    CM_DIST -- "exports: './codemods/manifest'" --> RUNNER_DIST

    subgraph consumer["Consumer project (at upgrade time)"]
        CLI["npx @designsystem/migrations\n--from=8.0.0 --to=9.0.0 --dir=./src"]
        FILES["Source files\n.tsx / .ts / .html / .vue"]
        PATCHED["Patched files"]

        CLI --> RUNNER_DIST
        RUNNER_DIST -->|"glob files\nby extension"| FILES
        FILES -->|"transform(source, filePath)"| PATCHED
    end

    style dpl fill:#f0f4ff,stroke:#6b7acd
    style mig fill:#f0fff4,stroke:#5aab72
    style consumer fill:#fff8f0,stroke:#c97c2e
```

### How transforms are discovered at runtime

```mermaid
sequenceDiagram
    participant CLI as bin/migrations.js
    participant Runner as src/runner.ts
    participant Manifest as codemods/dist/manifest.js
    participant Transform as codemods/dist/transforms/.../index.js
    participant FS as Consumer file system

    CLI->>Runner: runCli(argv)
    Runner->>Runner: parse --from, --to, --dir, --dry-run
    Runner->>Manifest: require.resolve('@designsystem/dpl-web-components/codemods/manifest')
    Manifest-->>Runner: CodemodEntry[] (version, id, transformPath, fileExtensions)
    Runner->>Runner: selectMigrations(all, from, to) — semver filter + sort
    Runner->>FS: glob **/*.{tsx,html,...} excluding node_modules, dist
    loop each selected migration × each matching file
        Runner->>Transform: require(absTransformPath)
        Transform-->>Runner: { transform(source, filePath) }
        Runner->>FS: readFileSync(filePath)
        FS-->>Runner: original source
        Runner->>Transform: transform(original, filePath)
        Transform-->>Runner: patched source
        alt source changed AND not dry-run
            Runner->>FS: writeFileSync(filePath, patched)
        end
    end
    Runner-->>CLI: RunResult { filesScanned, filesModified, migrationsApplied }
```

---

## Folder structure

```
codemods/
├── README.md               ← you are here
├── manifest.ts             ← version registry: each entry maps a semver to a transform module
├── jest.config.cjs         ← standalone Jest config (separate from Stencil's test runner)
├── tsconfig.cjs.json       ← compiles codemods/ → codemods/dist/ (CommonJS, no __tests__)
├── cli.ts                  ← direct per-transform runner (--transform <id> --dir <path>)
├── utils/
│   ├── common.ts           ← shared helpers like escapeRegExp()
│   ├── html.ts             ← HTML/Vue template helpers
│   └── jsx.ts              ← JSX/TSX AST helpers
└── transforms/
    └── v9.0.0/
        └── rename-dpl-button-variant-outline-to-ghost/
            ├── index.ts            ← transform(), transformJsx(), transformHtml()
            └── __tests__/
                └── index.test.ts   ← unit tests (inline string fixtures)
```

**Naming convention:** `transforms/<vX.Y.Z>/<kebab-description>/`  
The version folder is the `dpl-web-components` semver at which consumers must run this migration.

---

## How a transform works

Each transform exports three functions:

```typescript
// Route by file extension
export function transform(source: string, filePath: string): string

// AST-based via recast (for .ts, .tsx, .js, .jsx)
export function transformJsx(source: string): string

// Regex-based (for .html, .vue templates)
export function transformHtml(source: string): string
```

### JSX/TSX path — `replaceJsxStringAttr`

Uses `recast` with the `babel-ts` parser to walk the AST. Static `StringLiteral` attribute values are rewritten, and matching string literals inside `JSXExpressionContainer` values are also rewritten (for example `variant={"outline"}`). Modified nodes are reprinted using `recast.types.builders.stringLiteral()`, which creates a fresh node without source-location metadata, forcing recast to reprint only changed nodes while preserving surrounding formatting.

### HTML/Vue path — `replaceHtmlAttr`

Uses a two-pass regex strategy:

1. **Outer regex** matches the complete opening tag for target elements (e.g. `<dpl-button ...>` or `<dpl-button .../>`), handling multi-line attributes and quoted `>` characters inside attribute values.
2. **Inner regex** replaces the target attribute value within each matched tag only.

This scopes the replacement to opening tags and never touches text content or other elements. Dynamic Angular/Vue bindings are also supported for safe string-literal rewrites inside `[attr]="..."` and `:attr="..."`.

---

## Adding a new migration

### 0. Use the generator (recommended)

Use the Nx generator to scaffold a new transform with boilerplate, tests, and fixtures:

```bash
nx generate @designsystem/dpl-web-components:transform \
  --name=your-migration-id \
  --version=X.Y.Z \
  --description="One-line description of what this transform does" \
  --extensions=tsx,html,vue
```

This creates:
- Transform implementation at `codemods/transforms/vX.Y.Z/your-migration-id/index.ts`
- Test file and fixture templates
- Automatic manifest registration

Then skip to step 1 below (Write tests) and customize the generated files.

For more details, see [tools/generators/README.md](../../tools/generators/README.md).

---

### 1. Create the transform (manual)

If you prefer not to use the generator:

```bash
mkdir -p codemods/transforms/vX.Y.Z/your-migration-id
touch codemods/transforms/vX.Y.Z/your-migration-id/index.ts
mkdir -p codemods/transforms/vX.Y.Z/your-migration-id/__tests__
touch codemods/transforms/vX.Y.Z/your-migration-id/__tests__/index.test.ts
```

**`index.ts` skeleton:**

```typescript
import { replaceJsxStringAttr } from '../../../utils/jsx';
import { replaceHtmlAttr } from '../../../utils/html';

const TARGET_TAGS = ['dpl-my-component', 'DplMyComponent'];
const ATTR_NAME = 'old-prop';
const FROM_VALUE = 'old-value';
const TO_VALUE = 'new-value';

export function transformJsx(source: string): string {
  return replaceJsxStringAttr(source, TARGET_TAGS, ATTR_NAME, FROM_VALUE, TO_VALUE);
}

export function transformHtml(source: string): string {
  return replaceHtmlAttr(source, TARGET_TAGS, ATTR_NAME, FROM_VALUE, TO_VALUE);
}

export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) return transformJsx(source);
  if (/\.(html|vue)$/.test(filePath)) return transformHtml(source);
  return source;
}
```

### 2. Write tests

Required test cases before a migration is considered production-ready:

| Case | Why |
| --- | --- |
| Primary transformation | Proves the codemod does what it says |
| Already-migrated input (idempotency) | Running twice must not corrupt output |
| Dynamic binding (JSX / Angular / Vue) | Verify only safe literal/key rewrites happen; runtime references remain untouched |
| Unrelated component with same attribute | Must be scoped to target elements only |
| Multiple occurrences in one file | All instances must be updated |
| HTML/template variant | If applicable — covers Angular and Vue consumers |

### 3. Register in `manifest.ts`

```typescript
{
  version: 'X.Y.Z',
  id: 'your-migration-id',
  description: 'One-line description shown in CLI output.',
  fileExtensions: ['tsx', 'jsx', 'ts', 'js', 'html', 'vue'],
  transformPath: './transforms/vX.Y.Z/your-migration-id/index',
}
```

`transformPath` is relative to the manifest file. After `tsc`, both the manifest and transforms are in `codemods/dist/`, so the relative path is unchanged.

### 4. Build and test

```bash
# Type-check and compile
nx run dpl-web-components:codemods:build

# Run tests
nx run dpl-web-components:codemods:test

# Smoke-test against a real directory (dry run)
nx run dpl-web-components:codemods:run -- \
  --transform your-migration-id \
  --dir ../../apps/angular-demo/src \
  --dry-run
```

---

## Build pipeline

| Step | Command | Output |
| --- | --- | --- |
| Compile codemods to CJS | `nx run dpl-web-components:codemods:build` | `codemods/dist/` |
| Run codemod tests | `nx run dpl-web-components:codemods:test` | (depends on build) |
| **Validate transforms** | `nx run dpl-web-components:codemods:validate` | (depends on build) |
| **Strict validation (CI/CD)** | `nx run dpl-web-components:codemods:validate:strict` | (fails on warnings) |
| Run a transform directly | `nx run dpl-web-components:codemods:run -- --transform <id> --dir <path>` | Modified files |
| Build migrations CLI | `nx run migrations:build` | `packages/migrations/dist/` |
| Run migrations CLI tests | `nx run migrations:test` | — |

The `codemods/dist/` folder is included in the `files` array of `dpl-web-components/package.json` and exposed via the `./codemods/manifest` export condition so the `@designsystem/migrations` CLI can `require()` the compiled manifest and transforms after npm install.

### Validation Step

Before publication, run validation to ensure all transforms are safe and correct:

```bash
# Build codemods
nx run dpl-web-components:codemods:build

# Run tests
nx run dpl-web-components:codemods:test

# Validate (warnings don't fail)
nx run dpl-web-components:codemods:validate

# Strict validation for CI/CD (warnings fail)
nx run dpl-web-components:codemods:validate:strict
```

Validators check:
- ✅ **Manifest validity** — Version, ID, extensions, paths correct
- ✅ **Transform exports** — Required functions present with correct signatures
- ✅ **Fixture completeness** — Test files exist and are syntactically valid
- ✅ **Idempotency** — Running twice produces same result (via tests)
- ✅ **Safety** — No code corruption or data loss (via tests)

See [VALIDATION.md](./VALIDATION.md) for full details.

---

## Safety guardrails

- **Be conservative.** Only transform what you can statically verify as a literal. If a value could be dynamic, do nothing.
- **Idempotency.** `transform(transform(source)) === transform(source)` must always hold.
- **Dynamic bindings are opt-in and conservative.** Rewrite only safe literal/key patterns. Leave uncertain expressions unchanged and warn.
- **Scoped matching.** Regex transforms must operate inside opening tags only — never on text content, comments, or closing tags.
- **Test no-ops first.** If your no-op tests fail, the transform is too broad. Fix that before the positive cases.
- **Preserve formatting.** Use `recast` for JS/TS/JSX — it reprints only changed nodes. Avoid string-replacing the entire file.
- **One concern per transform.** Each transform file handles one logical migration. Don't batch unrelated changes.
