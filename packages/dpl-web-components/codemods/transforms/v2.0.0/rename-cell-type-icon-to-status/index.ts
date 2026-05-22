/**
 * Migration: rename-cell-type-icon-to-status (v2.0.0)
 *
 * Renames CellType "icon" → "status" and migrates the value from a plain
 * string to a Status object.
 *
 * Before: { type: 'icon', value: 'check-circle', ... }
 * After:  { type: 'status', value: { icon: 'check-circle', text: 'check-circle', color: 'gray' }, ... }
 *
 * What is NOT automatically migrated:
 *   - Dynamic / computed values (e.g. value: someVar, value: a ? 'x' : 'y') —
 *     only type is renamed; value is left unchanged for manual migration.
 *
 * Note: color defaults to 'gray'. Review each migrated cell and set the
 * appropriate color ('yellow' | 'green' | 'red' | 'blue' | 'gray').
 */

const DEFAULT_COLOR = 'gray';

/**
 * Transforms a single flat cell object string that is known to contain
 * `type: 'icon'`.
 */
function transformIconCell(obj: string): string {
  // 1. type: 'icon' / "icon"  →  type: 'status' / "status"
  let result = obj
    .replace(/(type\s*:\s*)"icon"/g, `$1"status"`)
    .replace(/(type\s*:\s*)'icon'/g, `$1'status'`);

  // 2. value: 'X' / "X"  →  value: { icon: 'X', text: 'X', color: 'gray' }
  //    Only string literals — dynamic values are left unchanged.
  result = result
    .replace(
      /(value\s*:\s*)"([^"]*)"/g,
      (_m, prefix, val) =>
        `${prefix}{ icon: "${val}", text: "${val}", color: "${DEFAULT_COLOR}" }`,
    )
    .replace(
      /(value\s*:\s*)'([^']*)'/g,
      (_m, prefix, val) =>
        `${prefix}{ icon: '${val}', text: '${val}', color: '${DEFAULT_COLOR}' }`,
    );

  return result;
}

/**
 * Replaces every flat object literal (no nested braces) that contains
 * `type: 'icon'` or `type: "icon"`.
 *
 * Cell properties are all scalars, so `[^{}]` boundaries correctly scope to
 * individual cell definitions without traversing parent containers.
 */
function replaceIconCells(source: string): string {
  return source.replace(
    /\{[^{}]*?type\s*:\s*['"]icon['"][^{}]*?\}/g,
    (match) => transformIconCell(match),
  );
}

export function transformJsx(source: string): string {
  return replaceIconCells(source);
}

export function transformHtml(source: string): string {
  return replaceIconCells(source);
}

/**
 * Unified entry point — routes to the correct transform based on file extension.
 */
export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) return transformJsx(source);
  if (/\.(html|vue)$/.test(filePath)) return transformHtml(source);
  return source;
}
