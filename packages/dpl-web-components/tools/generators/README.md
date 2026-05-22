# Transform Generator

This directory contains Nx generators for scaffolding codemods/transforms.

## Available Generators

### `transform`

Scaffold a new codemod transform with boilerplate, tests, and automatic manifest registration.

**Usage:**

```bash
# Interactive prompt
nx generate @designsystem/dpl-web-components:transform

# With options
nx generate @designsystem/dpl-web-components:transform \
  --name=rename-my-prop \
  --version=3.0.0 \
  --description="Renames my-prop to new-prop" \
  --extensions=tsx,html
```

**Options:**

- `--name` (required): Kebab-case ID of the transform (e.g., `rename-dpl-button-variant`)
- `--version` (required): Semantic version for this transform (e.g., `3.0.0`). The transform applies to upgrades to or past this version.
- `--description` (required): Human-readable description of what the transform does
- `--extensions` (optional, default: `ts,tsx,js,jsx,html,vue`): Comma-separated file extensions to target (no leading dots)
- `--includeFixtures` (optional, default: `true`): Create example fixture files for testing

**What it creates:**

```
packages/dpl-web-components/codemods/transforms/
  vX.Y.Z/
    {name}/
      index.ts                    # Transform implementation
      __tests__/
        fixtures.test.ts          # Test file
        fixtures/
          component.input.tsx     # Example JSX fixture
          component.output.tsx    # Expected JSX output
          template.input.html     # Example HTML fixture
          template.output.html    # Expected HTML output
```

**What it updates:**

- `packages/dpl-web-components/codemods/manifest.ts` — Automatically registers your transform with version and file extensions

## Workflow

1. **Generate the scaffold:**

   ```bash
   nx generate @designsystem/dpl-web-components:transform \
     --name=rename-cell-value-to-status \
     --version=3.0.0 \
     --description="Renames Cell.value → Cell.status"
   ```

2. **Implement the transform:**
   - Edit `index.ts` to add your transformation logic
   - The file contains `transformJsx()`, `transformHtml()`, and `transform()` functions
   - Reference utilities in `packages/dpl-web-components/codemods/utils/` for common patterns

3. **Create test fixtures:**
   - Replace the placeholder input/output files in `__tests__/fixtures/`
   - Add more fixtures as needed (e.g., `vue.input.vue`, `react.output.tsx`)

4. **Run tests:**

   ```bash
   pnpm --dir packages/dpl-web-components codemods:test
   ```

5. **Generate golden outputs (first run):**

   ```bash
   REGENERATE_FIXTURES=1 pnpm --dir packages/dpl-web-components codemods:test
   ```

6. **Build the codemods:**

   ```bash
   nx run dpl-web-components:codemods:build
   ```

## Tips

- **Reuse utilities**: Check [`packages/dpl-web-components/codemods/utils/`](../utils/) for shared transformation helpers (JSX, HTML, etc.)
- **Test fixtures**: More comprehensive fixtures catch edge cases. Add fixtures for each framework you support (React, Angular, Vue).
- **Dynamic values**: Document which dynamic values your transform does NOT handle — these require manual migration.
- **Dry-run first**: Always test with the migrations CLI in dry-run mode:
  ```bash
  npx @designsystem/migrations --from=2.0.0 --to=3.0.0 --dir=./src --dry-run
  ```
