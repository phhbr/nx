import { BuildCtx, CompilerCtx, Config, JsonDocs } from "@stencil/core/internal";
import { join } from "path";
import * as fs from "fs";

/**
 * Findet die vollständige Pfad zur Komponenten-Quelle anhand des Dateinamens
 */
function findComponentSourceFile(fileName: string, baseDir: string): string | null {
  try {
    const componentsDir = join(baseDir, 'src/components');
    const dirs = fs.readdirSync(componentsDir);
    
    for (const componentDir of dirs) {
      const filePath = join(componentsDir, componentDir, fileName);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
  } catch (e) {
    // Verzeichnis nicht lesbar
  }
  
  return null;
}

/**
 * Extrahiert alle Import-Paths aus einer Komponenten-Datei
 * Gibt ein Map von InterfaceName zu ImportPath zurück
 */
function extractImportPaths(sourceText: string): Map<string, string> {
  const importMap = new Map<string, string>();
  // Regex mit s Flag um . auch Newlines zu matchen
  const importRegex = /import\s*{\s*([\s\S]*?)\s*}\s*from\s*['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(sourceText)) !== null) {
    const imports = match[1]
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => imp.length > 0);
    const importPath = match[2];
    
    imports.forEach(imp => {
      // Handle "as" aliases: "something as alias"
      const parts = imp.split(/\s+as\s+/);
      const name = parts[0].trim();
      importMap.set(name, importPath);
    });
  }
  
  return importMap;
}

/**
 * Findet die Definition eines Interfaces im Source-Code oder den Import-Paths
 * Handhält nested Braces korrekt
 */
function findInterfaceDefinition(
  sourceText: string,
  interfaceName: string,
  importPaths: Map<string, string>,
  baseDir: string,
  logger?: any
): string | null {
  // Versuche erst im lokalen Source zu finden
  let definition = searchInterfaceInText(sourceText, interfaceName);
  
  if (definition) {
    return definition;
  }
  
  // Wenn nicht gefunden, suche in den Import-Paths
  const importPath = importPaths.get(interfaceName);
  if (importPath) {
    // Entferne trailing slash
    const cleanImportPath = importPath.replace(/\/$/, '');
    try {
      // Baue den Pfad zur Import-Datei
      let filePath: string | null = null;
      
      if (cleanImportPath.startsWith('.')) {
        // Relative imports - relativ zur Komponenten-Datei
        const componentDir = join(baseDir, 'src/components/dpl-button');
        const basePath = join(componentDir, cleanImportPath);
        
        // Versuche verschiedene Möglichkeiten
        const candidates = [
          basePath + '.ts',
          basePath + '.tsx',
          join(basePath, 'index.ts'),
          join(basePath, 'index.tsx'),
        ];
        
        
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            filePath = candidate;
            break;
          }
        }
      } else {
        // Absolutes oder alias import
        const basePath = join(baseDir, 'src', cleanImportPath);
        
        const candidates = [
          basePath + '.ts',
          basePath + '.tsx',
          join(basePath, 'index.ts'),
          join(basePath, 'index.tsx'),
        ];
        
        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            filePath = candidate;
            break;
          }
        }
      }
      
      if (filePath && fs.existsSync(filePath)) {
        const importedText = fs.readFileSync(filePath, 'utf-8');
        definition = searchInterfaceInText(importedText, interfaceName);
        
        // Wenn nicht gefunden und es index.ts ist, durchsuche das Verzeichnis
        if (!definition && (filePath.endsWith('/index.ts') || filePath.endsWith('\\index.ts'))) {
          const dirPath = join(filePath, '..');
          definition = searchInterfaceInDirectory(dirPath, interfaceName);
        }
      }
    } catch (e) {
      // Fehler beim Lesen der Import-Datei
    }
  }
  
  return definition;
}

/**
 * Sucht nach einer Interface-Definition rekursiv in einem Verzeichnis
 */
function searchInterfaceInDirectory(dirPath: string, interfaceName: string): string | null {
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const text = fs.readFileSync(filePath, 'utf-8');
        const definition = searchInterfaceInText(text, interfaceName);
        if (definition) {
          return definition;
        }
      } else if (stat.isDirectory() && !file.startsWith('.')) {
        const definition = searchInterfaceInDirectory(filePath, interfaceName);
        if (definition) {
          return definition;
        }
      }
    }
  } catch (e) {
    // Verzeichnis nicht lesbar
  }
  
  return null;
}

/**
 * Sucht nach einer Interface-Definition im Text
 */
function searchInterfaceInText(sourceText: string, interfaceName: string): string | null {
  const interfaceRegex = new RegExp(`interface\\s+${interfaceName}\\s*(?:<[^>]+>)?\\s*{`, 'g');
  const match = interfaceRegex.exec(sourceText);
  
  if (!match) {
    return null;
  }
  
  let startIndex = match.index;
  let braceCount = 0;
  let endIndex = startIndex;
  let foundOpeningBrace = false;
  
  for (let i = startIndex; i < sourceText.length; i++) {
    const char = sourceText[i];
    
    if (char === '{') {
      braceCount++;
      foundOpeningBrace = true;
    } else if (char === '}') {
      braceCount--;
      if (foundOpeningBrace && braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  const definition = sourceText.substring(startIndex, endIndex);
  
  // Begrenzung auf maximal 50 Zeilen
  const lines = definition.split('\n');
  if (lines.length > 50) {
    const truncated = lines.slice(0, 50).join('\n');
    return truncated + '\n  // ... (truncated)';
  }
  
  return definition;
}

/**
 * Generiert Markdown für Property Interfaces
 */
function generatePropertyInterfacesMarkdown(
  config: Record<string, { name: string; path: string }>,
  sourceText: string,
  importPaths: Map<string, string>,
  baseDir: string,
  logger?: any
): string {
  const interfaceNames = Object.keys(config);
  
  if (interfaceNames.length === 0) {
    return '';
  }
  
  let markdown = '## Property Interfaces\n\n';
  
  interfaceNames.forEach(interfaceName => {
    const { name: propName } = config[interfaceName];
    const importPathValue = importPaths.get(interfaceName);
    let importPath = config[interfaceName].path || importPathValue || '';
    
    
    const definition = findInterfaceDefinition(sourceText, interfaceName, importPaths, baseDir, logger);
    
    if (!definition) {
      logger?.warn(
        `Interface ${interfaceName} not found in source for property ${propName}`
      );
      return;
    }
    
    markdown += `### ${interfaceName}\n`;
    markdown += `Used in: \`${propName}\`\n\n`;
    
    if (importPath) {
      markdown += `**Import Path**: \`from '${importPath}'\`\n\n`;
    }
    
    markdown += '```typescript\n';
    markdown += definition + '\n';
    markdown += '```\n\n';
  });
  
  return markdown.trim();
}

/**
 * Generiert Markdown für Event Detail Interfaces
 */
function generateEventInterfacesMarkdown(
  config: Record<string, { name: string; path: string }>,
  sourceText: string,
  importPaths: Map<string, string>,
  baseDir: string,
  logger?: any
): string {
  const interfaceNames = Object.keys(config);
  
  if (interfaceNames.length === 0) {
    return '';
  }
  
  let markdown = '## Event Detail Interfaces\n\n';
  
  interfaceNames.forEach(interfaceName => {
    const { name: eventName } = config[interfaceName];
    let importPath = config[interfaceName].path || importPaths.get(interfaceName) || '';
    
    const definition = findInterfaceDefinition(sourceText, interfaceName, importPaths, baseDir, logger);
    
    if (!definition) {
      logger?.warn(
        `Interface ${interfaceName} not found in source for event ${eventName}`
      );
      return;
    }
    
    markdown += `### ${interfaceName}\n`;
    markdown += `Used in event: \`${eventName}\`\n\n`;
    
    if (importPath) {
      markdown += `**Import Path**: \`from '${importPath}'\`\n\n`;
    }
    
    markdown += '```typescript\n';
    markdown += definition + '\n';
    markdown += '```\n\n';
  });
  
  return markdown.trim();
}

export const readmeInterfacesGenerator = async (
  config: Config,
  compilerCtx: CompilerCtx,
  _buildCtx: BuildCtx,
  docs: JsonDocs
): Promise<void> => {
  for (const component of docs.components) {
    const propertyInterfacesConfig: Record<string, { name: string; path: string }> = {};
    const eventInterfacesConfig: Record<string, { name: string; path: string }> = {};

    component.props.forEach(({ type, name }) => {
      if (type.trim()[0] === 'I') {
        const interfaceType = type.replace(/\[\]$/, '');
        propertyInterfacesConfig[interfaceType] = {
          name,
          path: '',
        };
      }
    });

    component.events.forEach(({ detail, event }) => {
      if (detail.trim()[0] === 'I') {
        const interfaceType = detail.replace(/\[\]$/, '');
        eventInterfacesConfig[interfaceType] = {
          name: event,
          path: '',
        };
      }
    });

    // Finde die Komponenten-Quelle basierend auf fileName
    const fileName = component.fileName ?? '';
    
    // Bestimme das Basis-Verzeichnis des Projekts
    // Wenn wir vom config Objekt kein rootDir bekommen, nutzen wir process.cwd()
    const baseDir = process.cwd();
    const componentSourcePath = findComponentSourceFile(fileName, baseDir);

    if (!componentSourcePath) {
      config.logger?.warn(`Could not find source file for component ${component.tag}`);
      continue;
    }

    const sourceText = fs.readFileSync(componentSourcePath, 'utf-8') || '';
    
    if (!sourceText) {
      config.logger?.warn(`Source text is empty for component ${component.tag}`);
      continue;
    }
    // Extrahiere Import-Paths aus der Komponenten-Datei
    const importPaths = extractImportPaths(sourceText);

    // Generiere Markdown für Properties und Events
    const propertyInterfacesMarkdown = generatePropertyInterfacesMarkdown(
      propertyInterfacesConfig,
      sourceText,
      importPaths,
      baseDir,
      config.logger
    );

    const eventInterfacesMarkdown = generateEventInterfacesMarkdown(
      eventInterfacesConfig,
      sourceText,
      importPaths,
      baseDir,
      config.logger
    );

    const interfacesMarkdown = [
      propertyInterfacesMarkdown,
      eventInterfacesMarkdown,
    ]
      .filter(md => md.length > 0)
      .join('\n\n');

    // Schreibe nur wenn es Inhalte gibt
    if (interfacesMarkdown.trim().length > 0) {
      const usagesDir = component.usagesDir || join(config.srcDir ?? '', 'components', component.tag, 'usage');
      const interfacesReadmePath = join(usagesDir, '~interfaces-readme.md');
      
      const readmeContent = await compilerCtx.fs.writeFile(
        interfacesReadmePath,
        `<!-- Von Stencil automatisch generiert - nicht bearbeiten -->\n\n${interfacesMarkdown}\n`
      );

      if (readmeContent.changedContent) {
        config.logger?.info(
          `Updated interfaces readme for ${component.tag}`
        );
      }
    }
  }
};