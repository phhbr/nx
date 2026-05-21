import {
  renameHtmlDynamicBindingObjectPropKey,
  renameJsxObjectPropKey,
} from '../../../utils/index';

/**
 * Codemod: rename-dpl-button-config-test-interface-to-new-property
 *
 * ITestButtonConfig.testInterface (type SomeInterface) was deprecated in v9.0.0
 * and replaced by ITestButtonConfig.newProperty (type SomeNewInterface).
 *
 * Auto-transforms:
 *   - Inline JSX object literals: buttonConfig={{ testInterface: x }} → {{ newProperty: x }}
 *   - Angular/Vue dynamic object-literal bindings:
 *     [buttonConfig]="{ testInterface: x }" / :buttonConfig="{ testInterface: x }"
 *     → ..."{ newProperty: x }"
 *
 * Cannot auto-transform (emits console.warn instead):
 *   - Variable references: buttonConfig={someVar} — object type unverifiable without a type-checker
 *   - Dynamic template expressions without rewritable object-literal keys
 *     (e.g. [buttonConfig]="someConfig")
 *
 * File types: .tsx, .jsx (auto-transform) + .html, .vue (warn-only scan)
 */

const TARGET_TAGS = ['dpl-button', 'DplButton'];
const ATTR_NAME = 'buttonConfig';
const FROM_KEY = 'testInterface';
const TO_KEY = 'newProperty';

export function transformJsx(source: string, filePath?: string): string {
  return renameJsxObjectPropKey(
    source, TARGET_TAGS, ATTR_NAME, FROM_KEY, TO_KEY,
    filePath, console.warn,
  );
}

export function transformHtml(source: string, filePath?: string): string {
  return renameHtmlDynamicBindingObjectPropKey(
    source,
    TARGET_TAGS,
    ATTR_NAME,
    FROM_KEY,
    TO_KEY,
    filePath,
    console.warn,
  );
}

export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx$/.test(filePath)) return transformJsx(source, filePath);
  if (/\.(html|vue)$/.test(filePath)) return transformHtml(source, filePath);
  return source;
}
