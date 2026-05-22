/**
 * Manifest validator — ensures all entries are well-formed and consistent.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateManifest(
  manifest: Array<{
    version: string;
    id: string;
    description: string;
    fileExtensions: string[];
    transformPath: string;
  }>,
  manifestDir: string,
): ManifestValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const seenVersions = new Map<string, string[]>();

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    const prefix = `Entry ${i} (${entry.id}):`;

    // Validate version
    if (!semver.valid(entry.version)) {
      errors.push(`${prefix} Invalid semver version "${entry.version}"`);
    }

    // Validate ID
    if (!entry.id || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(entry.id)) {
      errors.push(
        `${prefix} Invalid ID "${entry.id}". Must be kebab-case (start with letter, contain only lowercase and hyphens).`,
      );
    }

    // Check for duplicate IDs
    if (seenIds.has(entry.id)) {
      errors.push(`${prefix} Duplicate ID "${entry.id}". Each transform must have a unique ID.`);
    }
    seenIds.add(entry.id);

    // Track versions to check for duplicates
    if (!seenVersions.has(entry.version)) {
      seenVersions.set(entry.version, []);
    }
    seenVersions.get(entry.version)!.push(entry.id);

    // Validate description
    if (!entry.description || entry.description.trim().length === 0) {
      errors.push(`${prefix} Missing or empty description.`);
    } else if (entry.description.length > 120) {
      warnings.push(
        `${prefix} Description is long (${entry.description.length}). Keep it under 120 chars.`,
      );
    }

    // Validate file extensions
    if (!Array.isArray(entry.fileExtensions) || entry.fileExtensions.length === 0) {
      errors.push(`${prefix} Must have at least one file extension.`);
    } else {
      const invalidExts = entry.fileExtensions.filter(
        (ext) => !ext.startsWith('.') || !/^\.[a-z]+$/.test(ext.toLowerCase()),
      );
      if (invalidExts.length > 0) {
        errors.push(
          `${prefix} Invalid extensions: ${invalidExts.join(', ')}. Must start with dot and be lowercase.`,
        );
      }
    }

    // Validate transform path exists
    if (!entry.transformPath) {
      errors.push(`${prefix} Missing transformPath.`);
    } else {
      const tsPath = path.resolve(manifestDir, entry.transformPath + '.ts');
      const jsPath = path.resolve(manifestDir, entry.transformPath + '.js');
      if (!fs.existsSync(tsPath) && !fs.existsSync(jsPath)) {
        errors.push(
          `${prefix} Transform file not found: ${tsPath} (or ${jsPath})`,
        );
      }
    }
  }

  // Check for multiple transforms at the same version
  for (const [version, ids] of seenVersions.entries()) {
    if (ids.length > 1) {
      warnings.push(
        `Multiple transforms at version ${version}: ${ids.join(', ')}. Consider grouping related migrations.`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
