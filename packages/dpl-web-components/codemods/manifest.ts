/**
 * Codemods manifest for @designsystem/dpl-web-components.
 *
 * Each entry declares one migration:
 *   - version:       The dpl-web-components semver at which this migration applies.
 *                    The migrations CLI runs it when upgrading FROM any version < entry.version
 *                    TO a version >= entry.version.
 *   - id:            Stable kebab-case identifier (also the --transform flag value for the CLI).
 *   - description:   Human-readable summary shown in dry-run output.
 *   - fileExtensions: File types this transform should be applied to.
 *   - transformPath: Path to the transform module, relative to this manifest file.
 *                    After tsc compilation, both this manifest and the transforms
 *                    land in codemods/dist/, preserving the relative path structure.
 *
 * To add a new migration:
 *   1. Create transforms/vX.Y.Z/<id>/index.ts (export transform, transformJsx, transformHtml)
 *   2. Add an entry here.
 *   3. Bump version and publish.
 */

import type { CodemodEntry } from './manifest.types';

const manifest: CodemodEntry[] = [
  {
    version: '2.0.0',
    id: 'rename-cell-type-icon-to-status',
    description:
      'Renames CellType "icon" → "status". Use "status" for status indicator cells.',
    fileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.html', '.vue'],
    transformPath: './transforms/v2.0.0/rename-cell-type-icon-to-status/index',
  },
];

export default manifest;
