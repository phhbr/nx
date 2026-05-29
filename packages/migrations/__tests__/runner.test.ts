import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  pathToFileUrl,
  resolveTransformImportSpecifier,
  runMigrations,
  selectMigrations,
} from '../src/runner';
import type { MigrationEntry } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'migrations-test-'));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

function readFile(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

// A stub migration for testing runner logic independent of the real codemods.
const stubAt200: MigrationEntry = {
  version: '2.0.0',
  id: 'stub-foo-to-bar',
  description: 'Test: replace FOO with BAR in .ts files',
  fileExtensions: ['ts'],
  transform: (source: string) => source.replace(/FOO/g, 'BAR'),
};

const stubAt300: MigrationEntry = {
  version: '3.0.0',
  id: 'stub-baz-to-qux',
  description: 'Test: replace BAZ with QUX in .ts files',
  fileExtensions: ['ts'],
  transform: (source: string) => source.replace(/BAZ/g, 'QUX'),
};

// ---------------------------------------------------------------------------
// path and import specifier helpers
// ---------------------------------------------------------------------------

describe('runner path helpers', () => {
  it('converts unix paths to file URLs', () => {
    expect(pathToFileUrl('/tmp/transforms/index.js')).toBe('file:///tmp/transforms/index.js');
  });

  it('converts windows paths to file URLs', () => {
    expect(pathToFileUrl('C:\\repo\\transforms\\index.js')).toBe(
      'file:///C:/repo/transforms/index.js',
    );
  });

  it('adds .js extension when transform path has no extension', () => {
    const specifier = resolveTransformImportSpecifier(
      '/repo/codemods/dist',
      './transforms/v2.0.0/example/index',
    );

    expect(specifier).toBe(
      'file:///repo/codemods/dist/transforms/v2.0.0/example/index.js',
    );
  });

  it('keeps .js extension when already present', () => {
    const specifier = resolveTransformImportSpecifier(
      '/repo/codemods/dist',
      './transforms/v2.0.0/example/index.js',
    );

    expect(specifier).toBe(
      'file:///repo/codemods/dist/transforms/v2.0.0/example/index.js',
    );
  });
});

// ---------------------------------------------------------------------------
// selectMigrations
// ---------------------------------------------------------------------------

describe('selectMigrations', () => {
  it('returns migrations where from < version <= to', () => {
    const result = selectMigrations([stubAt200, stubAt300], '1.0.0', '2.0.0');
    expect(result.map((m) => m.id)).toEqual(['stub-foo-to-bar']);
  });

  it('includes both migrations when range spans both versions', () => {
    const result = selectMigrations([stubAt200, stubAt300], '1.0.0', '3.0.0');
    expect(result.map((m) => m.id)).toEqual(['stub-foo-to-bar', 'stub-baz-to-qux']);
  });

  it('excludes migration when from >= version', () => {
    const result = selectMigrations([stubAt200], '2.0.0', '3.0.0');
    expect(result).toHaveLength(0);
  });

  it('excludes migration when to < version', () => {
    const result = selectMigrations([stubAt200], '1.0.0', '1.9.0');
    expect(result).toHaveLength(0);
  });

  it('filters by only list when provided', () => {
    const result = selectMigrations(
      [stubAt200, stubAt300],
      '1.0.0',
      '3.0.0',
      ['stub-baz-to-qux'],
    );
    expect(result.map((m) => m.id)).toEqual(['stub-baz-to-qux']);
  });

  it('sorts results by version ascending', () => {
    const result = selectMigrations([stubAt300, stubAt200], '1.0.0', '3.0.0');
    expect(result.map((m) => m.version)).toEqual(['2.0.0', '3.0.0']);
  });
});

// ---------------------------------------------------------------------------
// runMigrations — version filtering
// ---------------------------------------------------------------------------

describe('runMigrations — version filtering', () => {
  it('applies a migration when from < version <= to', async () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, 'test.ts', 'const x = "FOO";');

    await runMigrations({ dir, from: '1.0.0', to: '2.0.0' }, [stubAt200]);

    expect(readFile(filePath)).toBe('const x = "BAR";');
  });

  it('skips a migration when from >= version', async () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, 'test.ts', 'const x = "FOO";');

    await runMigrations({ dir, from: '2.0.0', to: '3.0.0' }, [stubAt200]);

    expect(readFile(filePath)).toBe('const x = "FOO";');
  });

  it('skips a migration when to < version', async () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, 'test.ts', 'const x = "FOO";');

    await runMigrations({ dir, from: '1.0.0', to: '1.9.0' }, [stubAt200]);

    expect(readFile(filePath)).toBe('const x = "FOO";');
  });

  it('applies multiple migrations in version order', async () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, 'test.ts', 'const a = "FOO"; const b = "BAZ";');

    await runMigrations({ dir, from: '1.0.0', to: '3.0.0' }, [stubAt300, stubAt200]);

    expect(readFile(filePath)).toBe('const a = "BAR"; const b = "QUX";');
  });
});

// ---------------------------------------------------------------------------
// runMigrations — dry run
// ---------------------------------------------------------------------------

describe('runMigrations — dry run', () => {
  it('does not write files when dryRun is true', async () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, 'test.ts', 'const x = "FOO";');

    await runMigrations({ dir, from: '1.0.0', to: '2.0.0', dryRun: true }, [stubAt200]);

    expect(readFile(filePath)).toBe('const x = "FOO";');
  });

  it('reports filesModified in dry run', async () => {
    const dir = makeTempDir();
    writeFile(dir, 'test.ts', 'const x = "FOO";');

    const result = await runMigrations(
      { dir, from: '1.0.0', to: '2.0.0', dryRun: true },
      [stubAt200],
    );

    expect(result.filesModified).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// runMigrations — only filter
// ---------------------------------------------------------------------------

describe('runMigrations — only filter', () => {
  it('skips migrations not in the only list', async () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, 'test.ts', 'const x = "FOO";');

    await runMigrations(
      { dir, from: '1.0.0', to: '2.0.0', only: ['other-migration'] },
      [stubAt200],
    );

    expect(readFile(filePath)).toBe('const x = "FOO";');
  });

  it('runs migrations that are in the only list', async () => {
    const dir = makeTempDir();
    const filePath = writeFile(dir, 'test.ts', 'const x = "FOO";');

    await runMigrations(
      { dir, from: '1.0.0', to: '2.0.0', only: ['stub-foo-to-bar'] },
      [stubAt200],
    );

    expect(readFile(filePath)).toBe('const x = "BAR";');
  });
});

// ---------------------------------------------------------------------------
// runMigrations — result shape
// ---------------------------------------------------------------------------

describe('runMigrations — result shape', () => {
  it('returns correct filesScanned and filesModified counts', async () => {
    const dir = makeTempDir();
    writeFile(dir, 'a.ts', 'const x = "FOO";');
    writeFile(dir, 'b.ts', 'const y = "NOOP";');

    const result = await runMigrations({ dir, from: '1.0.0', to: '2.0.0' }, [stubAt200]);

    expect(result.filesScanned).toBe(2);
    expect(result.filesModified).toBe(1);
    expect(result.migrationsApplied).toHaveLength(1);
    expect(result.migrationsApplied[0].id).toBe('stub-foo-to-bar');
    expect(result.migrationsApplied[0].filesModified).toBe(1);
  });

  it('returns zero counts when no migrations apply', async () => {
    const dir = makeTempDir();

    const result = await runMigrations({ dir, from: '5.0.0', to: '6.0.0' }, [stubAt200]);

    expect(result.filesScanned).toBe(0);
    expect(result.filesModified).toBe(0);
    expect(result.migrationsApplied).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// runMigrations — error handling
// ---------------------------------------------------------------------------

describe('runMigrations — validation', () => {
  it('throws on invalid --from version', async () => {
    await expect(
      runMigrations({ dir: '.', from: 'not-a-semver', to: '2.0.0' }, []),
    ).rejects.toThrow('Invalid --from version');
  });

  it('throws on invalid --to version', async () => {
    await expect(
      runMigrations({ dir: '.', from: '1.0.0', to: 'bad' }, []),
    ).rejects.toThrow('Invalid --to version');
  });
});

// ---------------------------------------------------------------------------
// runMigrations — scoped dependency alignment
// ---------------------------------------------------------------------------

describe('runMigrations — scoped dependency alignment', () => {
  it('updates scoped dependency versions in the closest package.json', async () => {
    const projectDir = makeTempDir();
    const srcDir = path.join(projectDir, 'src');
    fs.mkdirSync(srcDir);
    writeFile(srcDir, 'test.ts', 'const x = "NOOP";');

    writeFile(
      projectDir,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            '@designsystem/dpl-web-components': '^7.0.0',
            lodash: '^4.17.0',
          },
          devDependencies: {
            '@designsystem/migrations': '~7.1.0',
          },
        },
        null,
        2,
      ),
    );

    const result = await runMigrations(
      {
        dir: srcDir,
        from: '7.0.0',
        to: '8.0.0',
      },
      [],
    );

    const packageJson = JSON.parse(readFile(path.join(projectDir, 'package.json')));
    expect(packageJson.dependencies['@designsystem/dpl-web-components']).toBe('8.0.0');
    expect(packageJson.devDependencies['@designsystem/migrations']).toBe('8.0.0');
    expect(packageJson.dependencies.lodash).toBe('^4.17.0');
    expect(result.scopedDependencyUpdates?.dependencyCount).toBe(2);
    expect(result.migrationsApplied.some((m) => m.id === 'update-scoped-dependencies')).toBe(true);
    const dependencyUpdateMigration = result.migrationsApplied.find(
      (m) => m.id === 'update-scoped-dependencies',
    );
    expect(dependencyUpdateMigration?.developerHint).toContain('pnpm install');
  });

  it('supports depsStrategy=caret', async () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            '@designsystem/dpl-angular': '7.0.0',
          },
        },
        null,
        2,
      ),
    );

    await runMigrations(
      {
        dir,
        from: '7.0.0',
        to: '8.0.0',
        depsStrategy: 'caret',
      },
      [],
    );

    const packageJson = JSON.parse(readFile(path.join(dir, 'package.json')));
    expect(packageJson.dependencies['@designsystem/dpl-angular']).toBe('^8.0.0');
  });

  it('preserves prefix for depsStrategy=preserve-prefix', async () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            '@designsystem/foo': '^7.0.0',
            '@designsystem/bar': '~7.0.0',
            '@designsystem/baz': '7.0.0',
          },
        },
        null,
        2,
      ),
    );

    await runMigrations(
      {
        dir,
        from: '7.0.0',
        to: '8.0.0',
        depsStrategy: 'preserve-prefix',
      },
      [],
    );

    const packageJson = JSON.parse(readFile(path.join(dir, 'package.json')));
    expect(packageJson.dependencies['@designsystem/foo']).toBe('^8.0.0');
    expect(packageJson.dependencies['@designsystem/bar']).toBe('~8.0.0');
    expect(packageJson.dependencies['@designsystem/baz']).toBe('8.0.0');
  });

  it('skips protocol-based versions and leaves workspace references untouched', async () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            '@designsystem/dpl-web-components': 'workspace:*',
            '@designsystem/dpl-angular': 'file:../dpl-angular',
          },
        },
        null,
        2,
      ),
    );

    const result = await runMigrations(
      {
        dir,
        from: '7.0.0',
        to: '8.0.0',
      },
      [],
    );

    const packageJson = JSON.parse(readFile(path.join(dir, 'package.json')));
    expect(packageJson.dependencies['@designsystem/dpl-web-components']).toBe('workspace:*');
    expect(packageJson.dependencies['@designsystem/dpl-angular']).toBe('file:../dpl-angular');
    expect(result.scopedDependencyUpdates).toBeUndefined();
  });

  it('can disable scoped dependency alignment via updateScopeDeps=false', async () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            '@designsystem/dpl-web-components': '^7.0.0',
          },
        },
        null,
        2,
      ),
    );

    await runMigrations(
      {
        dir,
        from: '7.0.0',
        to: '8.0.0',
        updateScopeDeps: false,
      },
      [],
    );

    const packageJson = JSON.parse(readFile(path.join(dir, 'package.json')));
    expect(packageJson.dependencies['@designsystem/dpl-web-components']).toBe('^7.0.0');
  });

  it('counts dependency-only updates even when no source transforms apply', async () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'package.json',
      JSON.stringify(
        {
          dependencies: {
            '@designsystem/dpl-web-components': '^7.0.0',
          },
        },
        null,
        2,
      ),
    );

    const result = await runMigrations(
      {
        dir,
        from: '7.0.0',
        to: '8.0.0',
      },
      [],
    );

    expect(result.filesScanned).toBe(1);
    expect(result.filesModified).toBe(1);
  });
});
