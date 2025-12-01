# DPL Monorepo Development Guidelines

This is a pnpm workspace with an Nx monorepo containing Stencil.js web components and Angular packages.

## Workspace Structure

- `packages/dpl-web-components/` - Stencil.js web components library
- `packages/dpl-angular/` - Angular library
- `pnpm-workspace.yaml` - pnpm workspace configuration
- `nx.json` - Nx monorepo configuration
- `tsconfig.json` - Shared TypeScript configuration

## Development Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development mode for all packages
- `pnpm build` - Build all packages
- `pnpm test` - Run tests
- `pnpm lint` - Lint all packages

## Key Points

- Use pnpm for package management
- Nx provides caching and task orchestration
- Each package has its own `tsconfig` and build configuration
- Use TypeScript path aliases (configured in root `tsconfig.json`) to reference packages
