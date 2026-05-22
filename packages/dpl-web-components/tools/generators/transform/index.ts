import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  readJson,
  writeJson,
} from '@nx/devkit';

interface TransformGeneratorSchema {
  name: string;
  version: string;
  description: string;
  extensions?: string;
  includeFixtures?: boolean;
}

export default async function transformGenerator(
  tree: Tree,
  options: TransformGeneratorSchema,
) {
  const {
    name,
    version,
    description,
    extensions = 'ts,tsx,js,jsx,html,vue',
    includeFixtures = true,
  } = options;

  // Parse extensions into array with leading dots
  const exts = extensions
    .split(',')
    .map((e) => {
      const trimmed = e.trim();
      return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
    })
    .sort();

  const versionDir = `v${version}`;
  const transformRoot = joinPathFragments(
    'packages/dpl-web-components/codemods/transforms',
    versionDir,
    name,
  );

  // Generate transform implementation
  generateFiles(tree, joinPathFragments(__dirname, 'files'), transformRoot, {
    name,
    description,
    version,
    extensions: exts,
  });

  // Generate test and fixtures if requested
  if (includeFixtures) {
    generateFiles(tree, joinPathFragments(__dirname, 'files', 'tests'), transformRoot, {
      name,
      extensions: exts,
    });
  }

  // Update manifest
  updateManifest(tree, {
    version,
    id: name,
    description,
    fileExtensions: exts,
    versionDir,
  });

  await formatFiles(tree);
}

interface ManifestEntry {
  version: string;
  id: string;
  description: string;
  fileExtensions: string[];
  transformPath: string;
}

function updateManifest(
  tree: Tree,
  newEntry: {
    version: string;
    id: string;
    description: string;
    fileExtensions: string[];
    versionDir: string;
  },
) {
  const manifestPath = 'packages/dpl-web-components/codemods/manifest.ts';
  const content = tree.read(manifestPath, 'utf8');

  if (!content) {
    throw new Error(`Manifest file not found: ${manifestPath}`);
  }

  const transformPath = `./transforms/${newEntry.versionDir}/${newEntry.id}/index`;

  const newEntryCode = `  {
    version: '${newEntry.version}',
    id: '${newEntry.id}',
    description:
      '${newEntry.description}',
    fileExtensions: [${newEntry.fileExtensions.map((e) => `'${e}'`).join(', ')}],
    transformPath: '${transformPath}',
  },`;

  // Find the end of the manifest array and insert before the closing bracket
  const updatedContent = content.replace(
    /(const manifest: CodemodEntry\[\] = \[[\s\S]*?)(\];)/m,
    `$1${newEntryCode}\n$2`,
  );

  tree.write(manifestPath, updatedContent);
}
