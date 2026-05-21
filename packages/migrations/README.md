# @designsystem/migrations

Version-aware migration CLI for `@designsystem/dpl-web-components`. Run it once when upgrading between versions and it will automatically apply all the relevant codemods to your codebase.

## What this package does

- This package is the runner, not the transform source.
- It parses `--from`, `--to`, `--dir`, and optional filters like `--only`.
- It loads the codemod manifest from `@designsystem/dpl-web-components/codemods/manifest`.
- It scans matching files and applies each selected transform in semver order.
- The actual migration logic lives in `packages/dpl-web-components/codemods/`.

---

## Quickstart

```bash
# See what would change — no files written
npx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src --dry-run

# Apply for real
npx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src
```

Replace `./src` with the root of the directory you want to migrate. The tool scans recursively and skips `node_modules` and `dist` automatically.

---

## Why this exists

When `@designsystem/dpl-web-components` makes a breaking change — renaming a prop value, restructuring an attribute, removing a deprecated API — the migration CLI lets you upgrade without manually searching and replacing across your codebase.

You give it a `--from` and `--to` version. It figures out which migrations apply, runs them in order, and tells you what changed.

---

## Usage

```
npx @designsystem/migrations [options]

Options:
  --from <version>   Version you are upgrading FROM (exclusive). e.g. 8.0.0
  --to   <version>   Version you are upgrading TO   (inclusive). e.g. 9.0.0
  --dir  <path>      Directory to scan for files to migrate (required).
  --dry-run          Show which files would be modified without writing them.
  --only <id,...>    Comma-separated list of migration IDs to run (optional).
  --help             Show help.
```

### With pnpm

```bash
pnpm dlx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src
```

### With a local install

```bash
npm install --save-dev @designsystem/migrations
npx migrations --from=8.0.0 --to=9.0.0 --dir=./src
```

---

## Recommended workflow

1. **Read the changelog** for the version you are upgrading to. It will list which breaking changes have a codemod and which require manual action.

2. **Run dry-run first.** Check the list of files that would be modified before committing to anything:

   ```bash
   npx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src --dry-run
   ```

3. **Commit or stash your current changes** so the migration diff is clean and easy to review.

4. **Apply the migrations:**

   ```bash
   npx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src
   ```

5. **Review the diff** in your version control tool, run your tests, then commit.

---

## Available migrations

| From → To | ID | What it changes |
| --- | --- | --- |
| < 9.0.0 → ≥ 9.0.0 | `rename-dpl-button-variant-outline-to-ghost` | Renames `variant="outline"` → `variant="ghost"` on `<dpl-button>` and `<DplButton>` |
| < 9.0.0 → ≥ 9.0.0 | `rename-dpl-button-config-test-interface-to-new-property` | Renames `ITestButtonConfig.testInterface` → `newProperty` in inline `buttonConfig={{ ... }}` JSX object literals |

### File types supported

Each migration declares which file types it targets. Currently supported:

| Extension | Transform strategy |
| --- | --- |
| `.tsx`, `.jsx` | AST-based via `recast` (preserves formatting) |
| `.ts`, `.js` | AST-based via `recast` |
| `.html` | Constrained regex (opening-tag scoped) |
| `.vue` | Constrained regex (opening-tag scoped) |

Dynamic attribute bindings (e.g. `variant={someVar}`, `[variant]="..."`) are never touched — only static string literals are migrated.

---

## What the output looks like

```
[dry-run] Would modify: src/components/checkout/SubmitButton.tsx  (rename-dpl-button-variant-outline-to-ghost)
[dry-run] Would modify: src/app/app.component.html  (rename-dpl-button-variant-outline-to-ghost)

--- Migration Summary ---
Files scanned:  142
Files modified: 2
  rename-dpl-button-variant-outline-to-ghost: 2 file(s) modified

(dry-run mode: no files were written)
```

---

## Running a single migration

If you only want to run one specific migration and skip others in the range:

```bash
npx @designsystem/migrations \
  --from=8.0.0 \
  --to=9.0.0 \
  --dir=./src \
  --only=rename-dpl-button-variant-outline-to-ghost
```

---

## Troubleshooting

**"No migrations to apply for X → Y"**
The version range you specified does not include any registered migrations. Double-check your `--from` and `--to` values match the version you are actually upgrading between.

**"Invalid --from version"**
Both `--from` and `--to` must be valid semver strings (e.g. `8.0.0`, not `v8` or `8.x`).

**A file was not migrated that should have been**
Migrations only transform statically-known string literals. If your code uses a dynamic expression to set the prop value, you will need to update it manually.

**The migration changed something it should not have**
Please [open an issue](https://github.com/your-org/your-repo/issues) with the file contents (or a minimal reproduction). Migrations are designed to be conservative, so this is a bug.

---

## Safety guarantees

- Migrations are **idempotent** — running the same migration twice produces the same result as running it once.
- **Dry-run** never writes to disk — use it freely before committing.
- Only **string literal** attribute values are transformed. Dynamic bindings are always skipped.
- Files that do not need changing are never written.
