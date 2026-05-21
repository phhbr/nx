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

export interface CodemodEntry {
  version: string;
  id: string;
  description: string;
  fileExtensions: string[];
  transformPath: string;
}

const manifest: CodemodEntry[] = [
  {
    version: '9.0.0',
    id: 'rename-dpl-button-variant-outline-to-ghost',
    description:
      'Renames variant="outline" to variant="ghost" on <dpl-button> and <DplButton> elements.',
    fileExtensions: ['tsx', 'jsx', 'ts', 'js', 'html', 'vue'],
    transformPath:
      './transforms/v9.0.0/rename-dpl-button-variant-outline-to-ghost/index',
  },
  {
    version: '9.0.0',
    id: 'rename-dpl-button-config-test-interface-to-new-property',
    description:
      'Renames ITestButtonConfig.testInterface to newProperty in inline buttonConfig object literals on <dpl-button> and <DplButton>.',
    fileExtensions: ['tsx', 'jsx', 'html', 'vue'],
    transformPath:
      './transforms/v9.0.0/rename-dpl-button-config-test-interface-to-new-property/index',
  },
];

export default manifest;
