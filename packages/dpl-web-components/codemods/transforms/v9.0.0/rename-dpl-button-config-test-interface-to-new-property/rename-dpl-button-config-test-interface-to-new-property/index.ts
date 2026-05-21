import { renameJsxObjectPropKey } from '../../../utils/index';

/**
 * Codemod: rename-dpl-button-config-test-interface-to-new-property
 *
 * ITestButtonConfig.testInterface (type SomeInterface) was deprecated in v10.0.0
 * and replaced by ITestButtonConfig.newProperty (type SomeNewInterface).
 *
 * This codemod renames the `testInterface` key to `newProperty` inside inline
 * object literals passed as the `buttonConfig` prop on <dpl-button> / <DplButton>.
 *
 * Safe scope:
 *   - Only inline JSX object literals: buttonConfig={{ testInterface: x }}
 *   - Variable references (buttonConfig={someVar}) are NOT touched — the object
 *     shape cannot be verified without a type-checker.
 *   - Angular [buttonConfig]="..." bindings require manual update because the
 *     right-hand side is not statically parseable here.
 *
 * File types: .tsx and .jsx only (JSX is required for the scoped matching).
 */

const TARGET_TAGS = ['dpl-button', 'DplButton'];
const ATTR_NAME = 'buttonConfig';
const FROM_KEY = 'testInterface';
const TO_KEY = 'newProperty';

export function transformJsx(source: string): string {
  return renameJsxObjectPropKey(source, TARGET_TAGS, ATTR_NAME, FROM_KEY, TO_KEY);
}

export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx$/.test(filePath)) return transformJsx(source);
  return source;
}
