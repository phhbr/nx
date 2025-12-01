# DPL Monorepo

A pnpm workspace with Nx monorepo containing web components and Angular packages.

## Packages

### [@dpl/web-components](./packages/dpl-web-components)
Web components library built with Stencil.js.

### [@dpl/angular](./packages/dpl-angular)
Angular library for DPL.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Nx CLI

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
pnpm exec nx list

# Build a specific package
pnpm exec nx build dpl-web-components
pnpm exec nx build dpl-angular

# Run tests for a specific package
pnpm exec nx test dpl-web-components
pnpm exec nx test dpl-angular
```

## Workspace Structure

```
.
├── packages/
│   ├── dpl-web-components/     # Stencil.js components
│   └── dpl-angular/             # Angular library
├── pnpm-workspace.yaml          # pnpm workspace config
├── nx.json                       # Nx configuration
├── tsconfig.json                # Root TypeScript config
└── package.json                 # Root package.json
```

## License

MIT
