import * as recast from 'recast';
import type { WarnHandler } from './interfaces';
import type {
  JSXAttributeNode,
  JSXOpeningElementNode,
  JSXExpressionContainerNode,
} from './jsx.types';

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
  tagNames: string[],
  attrName: string,
  fromValue: string,
  toValue: string,
): string {
  const ast = recast.parse(source, {
    parser: require('recast/parsers/babel-ts'),
  });
  const tagSet = new Set(tagNames);
  let changed = false;

  recast.visit(ast, {
    visitJSXOpeningElement(path) {
      const node = path.node as JSXOpeningElementNode;
      const name = node.name;

      let localName: string | null = null;
      if (name.type === 'JSXIdentifier') {
        localName = name.name;
      }

      if (!localName || !tagSet.has(localName)) {
        return this.traverse(path);
      }

      for (const attr of (node.attributes ?? [])) {
        if (attr.type !== 'JSXAttribute') continue;
        const jsxAttr = attr as JSXAttributeNode;
        if (
          jsxAttr.name.type !== 'JSXIdentifier' ||
          jsxAttr.name.name !== attrName
        ) {
          continue;
        }
        if (
          jsxAttr.value &&
          jsxAttr.value.type === 'StringLiteral' &&
          (jsxAttr.value as recast.types.namedTypes.StringLiteral).value === fromValue
        ) {
          jsxAttr.value = recast.types.builders.stringLiteral(toValue);
          changed = true;
          continue;
        }

        if (jsxAttr.value?.type === 'JSXExpressionContainer') {
          const container = jsxAttr.value as JSXExpressionContainerNode;
          if (replaceStringLiteralsInNode(container.expression, fromValue, toValue)) {
            changed = true;
          }
        }
      }

      this.traverse(path);
    },
  });

  if (!changed) return source;
  return recast.print(ast).code;
}

/**
 * Renames an object property key inside a JSX expression-container attribute
 * on specific element tags.
 */
export function renameJsxObjectPropKey(
  source: string,
  tagNames: string[],
  attrName: string,
  fromKey: string,
  toKey: string,
  filePath?: string,
  warn?: WarnHandler,
): string {
  const ast = recast.parse(source, {
    parser: require('recast/parsers/babel-ts'),
  });
  const tagSet = new Set(tagNames);
  let changed = false;

  recast.visit(ast, {
    visitJSXOpeningElement(path) {
      const node = path.node as JSXOpeningElementNode;
      const name = node.name;

      let localName: string | null = null;
      if (name.type === 'JSXIdentifier') localName = name.name;
      if (!localName || !tagSet.has(localName)) return this.traverse(path);

      for (const attr of node.attributes ?? []) {
        if (attr.type !== 'JSXAttribute') continue;
        const jsxAttr = attr as JSXAttributeNode;
        if (
          jsxAttr.name.type !== 'JSXIdentifier' ||
          jsxAttr.name.name !== attrName
        ) continue;

        if (!jsxAttr.value || jsxAttr.value.type !== 'JSXExpressionContainer') continue;

        const container = jsxAttr.value as JSXExpressionContainerNode;

        if (!container.expression || container.expression.type !== 'ObjectExpression') {
          if (warn) {
            const loc = (jsxAttr as any).loc;
            const location = filePath
              ? `${filePath}${loc ? `:${loc.start.line}` : ''}`
              : loc ? `line ${loc.start.line}` : 'unknown location';
            warn(
              `Manual migration needed at ${location} — ` +
              `<${localName} ${attrName}={...}> uses a non-inline value. ` +
              `Check if the referenced object contains \`${fromKey}\` and rename it to \`${toKey}\` manually.`,
            );
          }
          continue;
        }

        const objExpr = container.expression as recast.types.namedTypes.ObjectExpression;
        for (const prop of objExpr.properties) {
          if (prop.type !== 'ObjectProperty' && prop.type !== 'Property') continue;
          const p = prop as any;
          if (p.computed) continue;

          const key = p.key;
          const keyMatches =
            (key.type === 'Identifier' && key.name === fromKey) ||
            (key.type === 'StringLiteral' && key.value === fromKey);
          if (!keyMatches) continue;

          if (p.shorthand) {
            p.key = recast.types.builders.identifier(toKey);
            p.value = recast.types.builders.identifier(fromKey);
            p.shorthand = false;
          } else {
            p.key = recast.types.builders.identifier(toKey);
          }
          changed = true;
        }
      }

      this.traverse(path);
    },
  });

  if (!changed) return source;
  return recast.print(ast).code;
}

function replaceStringLiteralsInNode(
  node: unknown,
  fromValue: string,
  toValue: string,
  visited = new WeakSet<object>(),
): boolean {
  if (!node || typeof node !== 'object') return false;
  if (visited.has(node as object)) return false;
  visited.add(node as object);

  const n = node as Record<string, unknown>;
  let changed = false;

  if (n.type === 'StringLiteral' && n.value === fromValue) {
    n.value = toValue;
    return true;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      if (replaceStringLiteralsInNode(item, fromValue, toValue, visited)) changed = true;
    }
    return changed;
  }

  for (const value of Object.values(n)) {
    if (replaceStringLiteralsInNode(value, fromValue, toValue, visited)) changed = true;
  }

  return changed;
}