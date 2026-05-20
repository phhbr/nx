#!/usr/bin/env node
'use strict';

/**
 * Entry point for the @designsystem/migrations CLI.
 *
 * Usage:
 *   npx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src
 *   pnpm dlx @designsystem/migrations --from=8.0.0 --to=9.0.0 --dir=./src --dry-run
 */
require('../dist/index').runCli(process.argv.slice(2));
