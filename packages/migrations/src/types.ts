/** A single registered migration. */
export interface MigrationEntry {
  /** Semver version at which this migration applies (e.g. "9.0.0"). */
  version: string;
  /** Stable kebab-case identifier. Used as the --only filter value. */
  id: string;
  /** Human-readable summary shown in dry-run output. */
  description: string;
  /** File extensions this migration applies to (with or without leading dot). */
  fileExtensions: string[];
  /**
   * Transform function — takes file source and absolute file path,
   * returns the transformed source. Returns the original source unchanged
   * if no transformation is applicable.
   */
  transform: (source: string, filePath: string) => string;
}

/** Options for the migration runner. */
export interface RunOptions {
  /** Absolute or relative path to the directory to scan. */
  dir: string;
  /** Starting version (exclusive lower bound). e.g. "8.0.0" */
  from: string;
  /** Target version (inclusive upper bound). e.g. "9.0.0" */
  to: string;
  /** If true, print which files would change but do not write. Default: false. */
  dryRun?: boolean;
  /** If provided, only run migrations whose id is in this list. */
  only?: string[];
}

/** Result returned by runMigrations(). */
export interface RunResult {
  filesScanned: number;
  filesModified: number;
  migrationsApplied: Array<{ id: string; filesModified: number }>;
}
