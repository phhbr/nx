# Transform Generator — Quick Start

## 30-second setup

```bash
# 1. Generate the scaffold
nx generate @designsystem/dpl-web-components:transform \
  --name=rename-my-prop \
  --version=3.0.0 \
  --description="Rename old-prop to new-prop"

# 2. Edit the generated files
#    → codemods/transforms/v3.0.0/rename-my-prop/index.ts
#    → codemods/transforms/v3.0.0/rename-my-prop/__tests__/fixtures/*.tsx
#    → codemods/transforms/v3.0.0/rename-my-prop/__tests__/fixtures/*.html

# 3. Build and test
nx run dpl-web-components:codemods:build
nx run dpl-web-components:codemods:test

# 4. Smoke-test with the migrations CLI (optional)
npx @designsystem/migrations --from=2.0.0 --to=3.0.0 --dir=./test-app/src --dry-run
```

## What gets created

```
codemods/transforms/v3.0.0/rename-my-prop/
├── index.ts                           # Implement transformJsx() and transformHtml()
└── __tests__/
    ├── fixtures.test.ts               # Test scaffolding (fixture-based)
    └── fixtures/
        ├── component.input.tsx        # Before
        ├── component.output.tsx       # After
        ├── template.input.html        # Before
        └── template.output.html       # After
```

The manifest (`codemods/manifest.ts`) is **automatically updated**.

## Quick tips

| Task | Command |
|------|---------|
| See all available transforms | `nx generate @designsystem/dpl-web-components:transform --help` |
| Regenerate golden files | `REGENERATE_FIXTURES=1 nx run dpl-web-components:codemods:test` |
| Run a transform directly | `nx run dpl-web-components:codemods:run -- --transform rename-my-prop --dir ./src --dry-run` |
| View fixture diffs during development | `git diff codemods/transforms/v3.0.0/rename-my-prop/__tests__/fixtures/` |

## Common patterns

### JSX/TSX: Rename component prop value

```typescript
import { replaceJsxStringAttr } from '../../../utils/jsx';

export function transformJsx(source: string): string {
  return replaceJsxStringAttr(
    source,
    ['DplButton', 'dpl-button'],
    'variant',
    'outline',
    'ghost'
  );
}
```

### HTML/Vue: Rename element attribute

```typescript
import { replaceHtmlAttr } from '../../../utils/html';

export function transformHtml(source: string): string {
  return replaceHtmlAttr(
    source,
    ['dpl-table', 'dpl-cell'],
    'icon-type',
    'status',
    'indicator'
  );
}
```

See [codemods/utils/README.md](./utils/) for advanced patterns.

## Need help?

- **Generator options:** `nx generate @designsystem/dpl-web-components:transform --help`
- **Transform guide:** [codemods/README.md](./README.md)
- **Utility functions:** [codemods/utils/](./utils/)
