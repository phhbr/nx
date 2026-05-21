import * as recast from 'recast';

type JSXAttribute = recast.types.namedTypes.JSXAttribute;
type JSXOpeningElement = recast.types.namedTypes.JSXOpeningElement;

/**
 * Replaces a JSX string literal attribute value on specific element tags.
 *
 * Uses recast for format-preserving AST transformation — only modified nodes
 * are reprinted; all other source formatting is left untouched.
 *
 * Skips JSXExpressionContainer values (dynamic bindings like variant={someVar}).
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
      const node = path.node as JSXOpeningElement;
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
        const jsxAttr = attr as JSXAttribute;
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
        }
      }

      this.traverse(path);
    },
  });

  if (!changed) return source;
  return recast.print(ast).code;
}

/**
 * Replaces an HTML attribute value on specific element tags using a
 * constrained two-pass regex strategy.
 *
 * Pass 1: Match each complete opening tag for target elements (handles
 *   multi-line attributes and quoted `>` characters inside attribute values).
 * Pass 2: Within each matched tag, replace `attrName="fromValue"` with
 *   `attrName="toValue"`.
 *
 * Only operates inside opening tags — text content between tags is unaffected.
 * Does not affect Angular-style `[attr]="..."` or Vue `:attr="..."` bindings
 * because those use different attribute name prefixes.
 */
export function replaceHtmlAttr(
  source: string,
  tagNames: string[],
  attrName: string,
  fromValue: string,
  toValue: string,
): string {
  const tagAlternation = tagNames.join('|');

  // Matches <tagName ... > or <tagName ... /> including multi-line attributes.
  // The content group ([^>\"'`]|\"[^\"]*\"|'[^']*'|`[^`]*`) handles:
  //   - Regular chars that are not > or quote chars
  //   - Double-quoted attribute values (may contain >)
  //   - Single-quoted attribute values
  //   - Template literal attribute values
  // Matches <tagName ... > or <tagName ... /> including multi-line attributes.
  // Content group handles any chars except >, ", ', `, plus quoted attribute
  // values (which may contain >) and lone slashes not followed by >.
  const openingTagRe = new RegExp(
    `<(?:${tagAlternation})` +
      `(?:[^>"'\`/]|"[^"]*"|'[^']*'|\`[^\`]*\`|/(?!>))*` +
      `(?:/>|>)`,
    'gs',
  );

  // Matches: whitespace + attrName="fromValue" followed by a word boundary
  // (space, /, or >) to avoid partial matches on names like `data-variant`.
  const attrRe = new RegExp(
    `(\\s${escapeRegExp(attrName)}=")${escapeRegExp(fromValue)}("(?=[\\s/>]))`,
    'g',
  );

  return source.replace(openingTagRe, (fullMatch) => {
    return fullMatch.replace(attrRe, `$1${toValue}$2`);
  });
}

/**
 * Renames an object property key inside a JSX expression-container attribute
 * on specific element tags.
 *
 * Targets only inline object literals passed as JSX expression containers,
 * e.g. `<dpl-button buttonConfig={{ testInterface: x }} />`.
 * Variable references like `buttonConfig={someVar}` are never touched because
 * the object's type cannot be verified without a full type-checker.
 * When such a reference is encountered, `warn` is called with the file path
 * and source line so the developer knows where to look.
 *
 * Handles both identifier keys (`testInterface: x`) and string-literal keys
 * (`"testInterface": x`). Correctly expands shorthand properties:
 * `{ testInterface }` → `{ newProperty: testInterface }`.
 *
 * Skips computed keys (`{ [expr]: x }`) entirely.
 */
export function renameJsxObjectPropKey(
  source: string,
  tagNames: string[],
  attrName: string,
  fromKey: string,
  toKey: string,
  filePath?: string,
  warn?: (message: string) => void,
): string {
  const ast = recast.parse(source, {
    parser: require('recast/parsers/babel-ts'),
  });
  const tagSet = new Set(tagNames);
  let changed = false;

  recast.visit(ast, {
    visitJSXOpeningElement(path) {
      const node = path.node as JSXOpeningElement;
      const name = node.name;

      let localName: string | null = null;
      if (name.type === 'JSXIdentifier') localName = name.name;
      if (!localName || !tagSet.has(localName)) return this.traverse(path);

      for (const attr of node.attributes ?? []) {
        if (attr.type !== 'JSXAttribute') continue;
        const jsxAttr = attr as JSXAttribute;
        if (
          jsxAttr.name.type !== 'JSXIdentifier' ||
          jsxAttr.name.name !== attrName
        ) continue;

        // Not an expression container at all (e.g. boolean attr) — skip silently.
        if (!jsxAttr.value || jsxAttr.value.type !== 'JSXExpressionContainer') continue;

        const container = jsxAttr.value as recast.types.namedTypes.JSXExpressionContainer;

        if (!container.expression || container.expression.type !== 'ObjectExpression') {
          // Variable reference, function call, ternary, etc. — cannot auto-migrate.
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

/**
 * Scans an HTML or Vue SFC file for dynamic attribute bindings
 * (Angular `[attrName]="..."` or Vue `:attrName="..."`) on target elements
 * and calls `warn` for each match.
 *
 * Does not modify the source — purely advisory. Used by migrations that cannot
 * safely rewrite Angular/Vue template expressions without a full framework parser.
 */
export function scanHtmlDynamicBindings(
  source: string,
  tagNames: string[],
  attrName: string,
  filePath: string,
  warn: (message: string) => void,
): void {
  const tagAlternation = tagNames.join('|');

  // Match complete opening tags for target elements, same strategy as replaceHtmlAttr.
  const openingTagRe = new RegExp(
    `<(?:${tagAlternation})` +
      `(?:[^>"'\`/]|"[^"]*"|'[^']*'|\`[^\`]*\`|/(?!>))*` +
      `(?:/>|>)`,
    'gs',
  );

  // Angular [attrName]="..." or Vue :attrName="..."
  const dynamicAttrRe = new RegExp(
    `(?:\\[${escapeRegExp(attrName)}\\]|:${escapeRegExp(attrName)})\\s*=\\s*["'][^"']*["']`,
    'g',
  );

  let match: RegExpExecArray | null;
  while ((match = openingTagRe.exec(source)) !== null) {
    if (!dynamicAttrRe.test(match[0])) continue;
    dynamicAttrRe.lastIndex = 0; // reset after .test()

    const lineNumber = source.substring(0, match.index).split('\n').length;
    warn(
      `Manual migration needed at ${filePath}:${lineNumber} — ` +
      `found dynamic [${attrName}] binding on <${match[0].match(new RegExp(`^<(${tagAlternation})`))?.[1]}>. ` +
      `Angular/Vue template bindings cannot be auto-migrated. ` +
      `Check if the bound object contains \`testInterface\` and rename it to \`newProperty\` manually.`,
    );
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
