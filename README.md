# DPL Monorepo

A pnpm workspace with Nx monorepo containing Stencil.js web components and Angular packages.

## Overview

This is a **playground** for exploring the "pass-through" pattern where:
- **dpl-web-components** defines web components and their interfaces using Stencil.js
- **dpl-angular** wraps these web components as Angular directives and re-exports their interfaces
- Consumers can import both the Angular component wrappers and the original web component interfaces from `@designsystem/dpl-angular`

This approach enables seamless interoperability between web components and Angular while maintaining type safety.

## Packages

### [@designsystem/dpl-web-components](./packages/dpl-web-components)
Web components library built with **Stencil.js**.
- Defines core web components (e.g., `dpl-button`)
- Generates TypeScript interfaces and type definitions
- Exports component definitions for framework integration
- Available at: `@designsystem/dpl-web-components/components`

### [@designsystem/dpl-angular](./packages/dpl-angular)
Angular library providing wrapped components and re-exported interfaces.
- Wraps Stencil web components as Angular directives with `@ProxyCmp`
- Re-exports interfaces from `dpl-web-components` for type safety
- Provides standalone Angular components
- Available at: `@designsystem/dpl-angular`

### [angular-demo](./apps/angular-demo)
Demo Angular application showcasing the usage of wrapped components.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 10+

### Installation

```bash
pnpm install
```

### Development

```bash
# Serve all packages
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Nx Commands

```bash
# List all projects
nx list

# Build a specific package
nx build @designsystem/dpl-web-components
nx build @designsystem/dpl-angular
nx build angular-demo

# Run tests for a specific package
nx test @designsystem/dpl-web-components
nx test @designsystem/dpl-angular
```

## Architecture

### Pass-Through Interface Pattern

The dpl-angular package demonstrates the "pass-through" pattern:

```typescript
// dpl-web-components/src/index.ts
export * from '@designsystem/dpl-web-components/components';

// dpl-angular/src/lib/standalone/components.ts
import { defineCustomElementDplButton } from '@designsystem/dpl-web-components/components';

@ProxyCmp({
  defineCustomElementFn: defineCustomElementDplButton
})
@Component({
  selector: 'dpl-button',
  standalone: true,
  template: '<ng-content></ng-content>'
})
export class DplButton { ... }
```

This allows consumers to:
```typescript
import { DplButton } from '@designsystem/dpl-angular';  // Angular wrapper
import type { Components } from '@designsystem/dpl-web-components/components';  // Web component types
```

## Workspace Structure

```
.
├── apps/
│   └── angular-demo/            # Demo Angular application
├── packages/
│   ├── dpl-web-components/      # Stencil.js components
│   │   ├── src/                 # Component source code
│   │   ├── components/          # Built component definitions
│   │   └── stencil.config.ts   # Stencil configuration
│   └── dpl-angular/             # Angular library wrapper
│       ├── src/                 # Angular component sources
│       ├── dist/                # Built Angular library
│       └── ng-package.json      # ng-packagr configuration
├── pnpm-workspace.yaml          # pnpm workspace config
├── nx.json                       # Nx configuration
├── tsconfig.json                # Root TypeScript config
└── package.json                 # Root package.json
```

## Key Configuration Files

- **pnpm-workspace.yaml**: Defines workspace packages
- **nx.json**: Nx caching and task configuration
- **tsconfig.json**: Shared TypeScript compiler options and module resolution
- **packages/dpl-web-components/stencil.config.ts**: Stencil build configuration
- **packages/dpl-angular/ng-package.json**: ng-packagr configuration for Angular library

## Module Resolution

The workspace uses:
- **pnpm workspaces** for local package linking with `workspace:*` protocol
- **Nx** for task caching and orchestration
- **Node** module resolution with proper `exports` configuration in package.json files

## License

MIT
