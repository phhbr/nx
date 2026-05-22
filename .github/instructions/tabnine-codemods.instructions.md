---
description: "Use when working on DPL web-components codemods, scaffolding new transforms, or validating migrations."
name: "Tabnine Codemods"
applyTo:
  - "packages/dpl-web-components/codemods/**"
  - "packages/dpl-web-components/tools/generators/**"
---

# Codemod Guidance

- Prefer the Nx generator to create new transforms: `nx generate @designsystem/dpl-web-components:transform`.
- Use a semantic versioned folder under `codemods/transforms/vX.Y.Z/` and keep the transform ID kebab-case.
- Implement the transform in `index.ts` and route by file type with `transform()`, `transformJsx()`, and `transformHtml()` when appropriate.
- Add or update fixture-based tests in `__tests__/fixtures.test.ts` and keep input/output pairs complete.
- Reuse helpers from `packages/dpl-web-components/codemods/utils/` before adding new ad hoc parsing logic.
- Run `nx run dpl-web-components:codemods:build` before validation so the CLI and manifest compile.
- Run `nx run dpl-web-components:codemods:test` after changes, and use `REGENERATE_FIXTURES=1 nx run dpl-web-components:codemods:test` when golden outputs need to be refreshed.
- Validate the package with `nx run dpl-web-components:codemods:validate` and use `nx run dpl-web-components:codemods:validate:strict` before release or CI sign-off.
- Use a dry run of the migrations CLI to smoke-test behavior against sample source before shipping a new codemod.
- Keep transforms idempotent and narrowly scoped to the targeted component, attribute, or versioned migration.