export { escapeRegExp } from './common';
export {
  replaceJsxStringAttr,
  renameJsxObjectPropKey,
} from './jsx';
export {
  replaceHtmlAttr,
  renameHtmlDynamicBindingObjectPropKey,
  scanHtmlDynamicBindings,
} from './html';import * as recast from 'recast';

type JSXAttribute = recast.types.namedTypes.JSXAttribute;
type JSXOpeningElement = recast.types.namedTypes.JSXOpeningElement;

/**
 * Replaces a JSX string literal attribute value on specific element tags.
 *
 * Uses recast for format-preserving AST transformation — only modified nodes
 * are reprinted; all other source formatting is left untouched.
 *
 * Rewrites JSXExpressionContainer values when they contain matching
 * string literals (e.g. variant={"outline"}).
 * Skips JSX spread attributes.
 * Skips member expression element names like <Foo.Bar>.
 */
export function replaceJsxStringAttr(
  source: string,
  export { escapeRegExp } from './common';
  export {
    replaceJsxStringAttr,
    renameJsxObjectPropKey,
  } from './jsx';
  export {
    replaceHtmlAttr,
    renameHtmlDynamicBindingObjectPropKey,
    scanHtmlDynamicBindings,
  } from './html';

