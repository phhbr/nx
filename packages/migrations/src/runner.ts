import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as semver from 'semver';
import type { MigrationEntry, RunOptions, RunResult } from './types';

/**
 * Converts an absolute file path to a file:// URL.
 * This is required for proper module resolution on Windows with ESM loaders.
 * 
 * Windows: C:\path\to\file → file:///C:/path/to/file
 * Unix: /path/to/file → file:///path/to/file
 */
export function pathToFileUrl(filePath: string): string {
  // Normalize to forward slashes
  let normalized = filePath.replace(/\\/g, '/');
  
  // Handle Windows drive letters (C: → /C:)
  if (/^[a-zA-Z]:/.test(normalized)) {
    normalized = '/' + normalized;
  }
  
  // Ensure it starts with / for proper URL format
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  
  return `file://${normalized}`;
}

export function resolveTransformImportSpecifier(
  manifestDir: string,
  transformPath: string,
): string {
  const absTransformPath = path.resolve(manifestDir, transformPath);
  const pathWithJsExtension = absTransformPath.endsWith('.js')
    ? absTransformPath
    : `${absTransformPath}.js`;

  return pathToFileUrl(pathWithJsExtension);
}

function normalizeExtension(ext: string): string {
  const trimmed = ext.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.startsWith('.') ? trimmed.slice(1) : trimmed;
}

function normalizeExtensions(exts: string[]): string[] {
  return [...new Set(exts.map(normalizeExtension).filter(Boolean))];
}

function normalizeScope(scope: string): string {
  const trimmed = scope.trim();
  if (!trimmed) return '@designsystem';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function isScopedDependency(packageName: string, scope: string): boolean {
  return packageName.startsWith(`${scope}/`);
}

function isVersionProtocolValue(version: string): boolean {
  return /^(workspace:|file:|link:|portal:)/.test(version);
}

function formatAlignedVersion(
  targetVersion: string,
  currentValue: string,
  strategy: 'exact' | 'caret' | 'preserve-prefix',
): string {
  if (strategy === 'caret') {
    return `^${targetVersion}`;
  }

  if (strategy === 'preserve-prefix') {
    if (currentValue.startsWith('^')) return `^${targetVersion}`;
    if (currentValue.startsWith('~')) return `~${targetVersion}`;
  }

  return targetVersion;
}

function findClosestPackageJson(startDir: string): string | undefined {
  let currentDir = path.resolve(startDir);

  // Guard against callers accidentally passing a file path instead of a directory.
  if (fs.existsSync(currentDir) && fs.statSync(currentDir).isFile()) {
    currentDir = path.dirname(currentDir);
  }

  while (true) {
    const candidate = path.join(currentDir, 'package.json');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }

    const parent = path.dirname(currentDir);
    if (parent === currentDir) {
      return undefined;
    }
    currentDir = parent;
  }
}

function alignScopedDependenciesInClosestPackageJson(
  dir: string,
  toVersion: string,
  scope: string,
  depsStrategy: 'exact' | 'caret' | 'preserve-prefix',
  dryRun: boolean,
): { filesScanned: number; filesModified: number; dependencyCount: number; packageJsonPath?: string } {
  const packageJsonPath = findClosestPackageJson(dir);
  if (!packageJsonPath) {
    return { filesScanned: 0, filesModified: 0, dependencyCount: 0 };
  }

  const packageJsonRaw = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonRaw) as Record<string, unknown>;
  const scopedPrefix = normalizeScope(scope);
  let dependencyCount = 0;

  const dependencySections = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ];

  for (const sectionName of dependencySections) {
    const section = packageJson[sectionName];
    if (!section || typeof section !== 'object' || Array.isArray(section)) {
      continue;
    }

    const deps = section as Record<string, unknown>;
    for (const [depName, depVersion] of Object.entries(deps)) {
      if (!isScopedDependency(depName, scopedPrefix) || typeof depVersion !== 'string') {
        continue;
      }

      if (isVersionProtocolValue(depVersion)) {
        continue;
      }

      const nextValue = formatAlignedVersion(toVersion, depVersion, depsStrategy);
      if (depVersion !== nextValue) {
        deps[depName] = nextValue;
        dependencyCount++;
      }
    }
  }

  if (dependencyCount === 0) {
    return {
      filesScanned: 1,
      filesModified: 0,
      dependencyCount: 0,
      packageJsonPath,
    };
  }

  if (dryRun) {
    console.log(`[dry-run] Would modify: ${packageJsonPath}  (update-scoped-dependencies)`);
  } else {
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
    console.log(`Modified: ${packageJsonPath}  (update-scoped-dependencies)`);
  }

  return {
    filesScanned: 1,
    filesModified: 1,
    dependencyCount,
    packageJsonPath,
  };
}

/**
 * Loads migrations from the manifest shipped inside @designsystem/dpl-web-components.
 *
 * The manifest is resolved via the package's exports map:
 *   @designsystem/dpl-web-components/codemods/manifest
 * → codemods/dist/manifest.js (CJS, compiled from codemods/manifest.ts)
 *
 * Each entry's transformPath is resolved relative to the manifest file,
 * so the compiled transform modules are found at codemods/dist/transforms/...
 */
export async function loadMigrationsFromManifest(): Promise<MigrationEntry[]> {
  const manifestPath = require.resolve(
    '@designsystem/dpl-web-components/codemods/manifest',
  );

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const manifestModule = require(manifestPath) as {
    default: Array<{
      version: string;
      id: string;
      description: string;
      fileExtensions: string[];
      transformPath: string;
      developerHint?: string;
    }>;
  };

  const manifestDir = path.dirname(manifestPath);

  const migrations = await Promise.all(
    manifestModule.default.map(async (entry) => {
      const transformFileUrl = resolveTransformImportSpecifier(manifestDir, entry.transformPath);
      const transformModule = (await import(transformFileUrl)) as {
        transform: (source: string, filePath: string) => string;
      };
      return {
        version: entry.version,
        id: entry.id,
        description: entry.description,
        fileExtensions: entry.fileExtensions,
        developerHint: entry.developerHint,
        transform: transformModule.transform,
      };
    }),
  );

  return migrations;
}

/**
 * Selects migrations that apply for the given from → to upgrade path.
 *
 * A migration at version V applies when: from < V <= to
 * Results are sorted by version ascending (run older migrations first).
 */
export function selectMigrations(
  all: MigrationEntry[],
  from: string,
  to: string,
  only?: string[],
): MigrationEntry[] {
  return all
    .filter((m) => {
      const inRange = semver.gt(m.version, from) && semver.lte(m.version, to);
      const inOnly = !only || only.length === 0 || only.includes(m.id);
      return inRange && inOnly;
    })
    .sort((a, b) => semver.compare(a.version, b.version));
}

/**
 * Applies the selected migrations to all matching files in options.dir.
 *
 * Pass injectedMigrations to override the manifest (used in tests to avoid
 * depending on the compiled codemods package).
 */
export async function runMigrations(
  options: RunOptions,
  injectedMigrations?: MigrationEntry[],
): Promise<RunResult> {
  const {
    dir,
    from,
    to,
    dryRun = false,
    only,
    updateScopeDeps = true,
    scope = '@designsystem',
    depsStrategy = 'exact',
  } = options;

  if (!semver.valid(from)) {
    throw new Error(`Invalid --from version: "${from}"`);
  }
  if (!semver.valid(to)) {
    throw new Error(`Invalid --to version: "${to}"`);
  }

  const allMigrations = injectedMigrations ?? (await loadMigrationsFromManifest());
  const migrations = selectMigrations(allMigrations, from, to, only);

  if (migrations.length === 0) {
    console.log(`No migrations to apply for ${from} → ${to}.`);
  }

  const files: string[] = [];
  if (migrations.length > 0) {
    const allExtensions = normalizeExtensions(migrations.flatMap((m) => m.fileExtensions));
    const extPart =
      allExtensions.length === 1
        ? allExtensions[0]
        : `{${allExtensions.join(',')}}`;

    // Normalize to forward slashes for glob pattern (glob expects / not \)
    const resolvedDir = path.resolve(dir).split(path.sep).join('/');
    const pattern = `${resolvedDir}/**/*.${extPart}`;
    files.push(
      ...(await glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**'],
        absolute: true,
      })),
    );
  }

  let totalFilesModified = 0;
  const migrationsApplied: RunResult['migrationsApplied'] = [];

  for (const migration of migrations) {
    const extSet = new Set(normalizeExtensions(migration.fileExtensions));
    const relevantFiles = files.filter((f) => extSet.has(normalizeExtension(path.extname(f))));
    let migrationFilesModified = 0;

    for (const filePath of relevantFiles) {
      const original = fs.readFileSync(filePath, 'utf8');
      const transformed = migration.transform(original, filePath);

      if (transformed !== original) {
        migrationFilesModified++;
        totalFilesModified++;

        if (dryRun) {
          console.log(`[dry-run] Would modify: ${filePath}  (${migration.id})`);
        } else {
          fs.writeFileSync(filePath, transformed, 'utf8');
          console.log(`Modified: ${filePath}  (${migration.id})`);
        }
      }
    }

    migrationsApplied.push({
      id: migration.id,
      filesModified: migrationFilesModified,
      developerHint: migration.developerHint,
    });
  }

  let scopedDependencyUpdates: RunResult['scopedDependencyUpdates'];
  let dependencyFilesScanned = 0;

  if (updateScopeDeps) {
    const depResult = alignScopedDependenciesInClosestPackageJson(
      dir,
      to,
      scope,
      depsStrategy,
      dryRun,
    );
    dependencyFilesScanned = depResult.filesScanned;
    totalFilesModified += depResult.filesModified;

    if (depResult.filesModified > 0 && depResult.packageJsonPath) {
      migrationsApplied.push({
        id: 'update-scoped-dependencies',
        filesModified: depResult.filesModified,
        developerHint:
          'Dependencies were updated in package.json. Run your package manager install (for this workspace: pnpm install) to refresh lockfile and node_modules.',
      });
      scopedDependencyUpdates = {
        packageJsonPath: depResult.packageJsonPath,
        dependencyCount: depResult.dependencyCount,
      };
    }
  }

  return {
    filesScanned: files.length + dependencyFilesScanned,
    filesModified: totalFilesModified,
    migrationsApplied,
    scopedDependencyUpdates,
  };
}
