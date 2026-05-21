import { replaceJsxStringAttr, replaceHtmlAttr } from '../../../utils/index';

/**
 * Migration: rename-dpl-button-variant-outline-to-ghost (v9.0.0)
 *
 * Renames variant="outline" → variant="ghost" on <dpl-button> and <DplButton>
 * elements across JSX/TSX files and HTML/Vue template files.
 *
 * What is transformed:
 *   - <dpl-button variant="outline" />         → <dpl-button variant="ghost" />
 *   - <dpl-button variant="outline"></dpl-button> → <dpl-button variant="ghost"></dpl-button>
 *   - <DplButton variant="outline" />          → <DplButton variant="ghost" />
 *   (DplButton is the Angular proxy component name exported from @designsystem/dpl-angular)
 *
 * What is NOT transformed:
 *   - variant={someVar}  (non-literal runtime bindings)
 *   - Other components that happen to have variant="outline"
 *   - Other props on dpl-button
 *   - Text content containing "outline"
 *
 * Dynamic bindings are partially supported:
 *   - JSX: string literals inside expressions are rewritten
 *     (e.g. variant={isA ? "outline" : "solid"} → ..."ghost"...)
 *   - Angular/Vue templates: quoted string literals inside
 *     [variant]="..." / :variant="..." are rewritten.
 */

const TARGET_TAGS = ['dpl-button', 'DplButton'];
const ATTR_NAME = 'variant';
const FROM_VALUE = 'outline';
const TO_VALUE = 'ghost';

/** AST-based transform for JSX/TSX files. */
export function transformJsx(source: string): string {
  return replaceJsxStringAttr(source, TARGET_TAGS, ATTR_NAME, FROM_VALUE, TO_VALUE);
}

/** Regex-based transform for HTML and Vue SFC template files. */
export function transformHtml(source: string): string {
  return replaceHtmlAttr(source, TARGET_TAGS, ATTR_NAME, FROM_VALUE, TO_VALUE);
}

/**
 * Unified entry point — routes to the correct transform based on file extension.
 * Called by the migrations runner with the file source and absolute path.
 */
export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) return transformJsx(source);
  if (/\.(html|vue)$/.test(filePath)) return transformHtml(source);
  return source;
}
