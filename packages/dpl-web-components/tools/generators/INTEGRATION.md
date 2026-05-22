# Generator Integration Guide

## What was created

An Nx generator for `@designsystem/dpl-web-components` that scaffolds new codemods/transforms with full boilerplate, test fixtures, and automatic manifest registration.

### File structure

```
packages/dpl-web-components/
└── tools/
    └── generators/
        ├── generators.json              ← Nx generator registration
        ├── package.json                 ← Identifies as generators
        ├── README.md                    ← Full documentation
        ├── QUICKSTART.md                ← 30-second setup
        └── transform/
            ├── index.ts                 ← Generator implementation
            ├── schema.json              ← CLI options schema
            ├── tsconfig.json            ← TypeScript config
            └── files/                   ← Templates for scaffolding
                ├── index.ts__template__
                └── tests/
                    ├── fixtures.test.ts__template__
                    └── fixtures/
                        ├── component.input.tsx__template__
                        ├── component.output.tsx__template__
                        ├── template.input.html__template__
                        └── template.output.html__template__
```

### How it works

1. **Generator runs** → Creates transform files from templates
2. **Template substitution** → Fills in name, description, version, extensions
3. **Manifest update** → Registers new transform automatically
4. **File formatting** → Applies workspace eslint/prettier rules

## Usage

### Interactive mode (recommended)

```bash
nx generate @designsystem/dpl-web-components:transform
```

Then answer prompts:
- Transform name (kebab-case)
- Semantic version (e.g., 3.0.0)
- Description
- File extensions (default: ts,tsx,js,jsx,html,vue)

### With arguments

```bash
nx generate @designsystem/dpl-web-components:transform \
  --name=rename-button-variant \
  --version=3.0.0 \
  --description="Rename variant outline to ghost" \
  --extensions=tsx,html
```

## Integration with Nx

### Registration

The `dpl-web-components` package now advertises generators via:
- `package.json`: `"generators": "./tools/generators"`
- `tools/generators/generators.json`: Defines available generators

Nx automatically discovers and registers this generator when you run `nx generate`.

### Build target (optional)

For production builds, you may want to compile generators to CommonJS:

```bash
# In project.json
"generators:build": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc -p tools/generators/transform/tsconfig.json"
  }
}
```

Run with: `nx run dpl-web-components:generators:build`

## Developer workflow

### 1. Generate a new transform

```bash
nx generate @designsystem/dpl-web-components:transform \
  --name=my-breaking-change \
  --version=3.0.0 \
  --description="Migrate from old API to new API"
```

Output:
```
✔ Generated the following files:
  • codemods/transforms/v3.0.0/my-breaking-change/index.ts
  • codemods/transforms/v3.0.0/my-breaking-change/__tests__/fixtures.test.ts
  • codemods/transforms/v3.0.0/my-breaking-change/__tests__/fixtures/component.input.tsx
  • codemods/transforms/v3.0.0/my-breaking-change/__tests__/fixtures/component.output.tsx
  • codemods/transforms/v3.0.0/my-breaking-change/__tests__/fixtures/template.input.html
  • codemods/transforms/v3.0.0/my-breaking-change/__tests__/fixtures/template.output.html
  ✔ Updated codemods/manifest.ts
```

### 2. Implement the transform

Edit `codemods/transforms/v3.0.0/my-breaking-change/index.ts`:

```typescript
export function transformJsx(source: string): string {
  // Your logic here
  return source;
}

export function transformHtml(source: string): string {
  // Your logic here
  return source;
}

export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) return transformJsx(source);
  if (/\.(html|vue)$/.test(filePath)) return transformHtml(source);
  return source;
}
```

### 3. Update test fixtures

- Input files: `.../__tests__/fixtures/*.input.*`
- Output files: `.../__tests__/fixtures/*.output.*`

Example: Before and after for a prop rename

**component.input.tsx:**
```typescript
<DplButton variant="outline" />
```

**component.output.tsx:**
```typescript
<DplButton variant="ghost" />
```

### 4. Build and test

```bash
# Build codemods
nx run dpl-web-components:codemods:build

# Run tests
nx run dpl-web-components:codemods:test

# Regenerate golden files (first run)
REGENERATE_FIXTURES=1 nx run dpl-web-components:codemods:test
```

### 5. Test end-to-end

```bash
# Smoke test with the CLI (dry-run)
npx @designsystem/migrations \
  --from=2.0.0 \
  --to=3.0.0 \
  --dir=./apps/my-app/src \
  --dry-run

# Or test a specific transform
nx run dpl-web-components:codemods:run -- \
  --transform my-breaking-change \
  --dir ./test-project/src \
  --dry-run
```

## Benefits

✅ **Consistency** — All transforms follow the same structure
✅ **Speed** — Scaffold a transform in seconds
✅ **Automation** — Manifest is updated automatically
✅ **Correctness** — Templates include best practices
✅ **Testing** — Fixture-based test structure ready to use
✅ **Documentation** — Generated code has helpful comments

## Maintenance

### When to update the templates

Edit `tools/generators/transform/files/` if:
- You want to change the transform boilerplate
- You add new test utilities
- You change how tests are structured
- You want different default exports/imports

### When to update the generator logic

Edit `tools/generators/transform/index.ts` if:
- Manifest structure changes
- You need to update different files
- You want to add new template variables
- You need to support new file types

## Troubleshooting

**"Generator not found"**
→ Run `nx reset` to clear cache and re-register generators

**"Files not created"**
→ Check that `tools/generators/generators.json` has correct factory paths

**"Manifest didn't update"**
→ Verify manifest path is `packages/dpl-web-components/codemods/manifest.ts`

**"Template variables not replaced"**
→ Template variables use `<%= name %>` syntax. Check `files/` directory.

## Further reading

- [Full generator README](./README.md)
- [Quick start guide](./QUICKSTART.md)
- [Codemods README](../codemods/README.md)
- [Nx generators docs](https://nx.dev/plugin-features/use-code-generators)
