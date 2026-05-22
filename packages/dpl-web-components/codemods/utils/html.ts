import { escapeRegExp } from './common';
import type { RewriteOutcome, WarnHandler } from './interfaces';

export function replaceHtmlAttr(
  source: string,
  tagNames: string[],
  attrName: string,
  fromValue: string,
  toValue: string,
): string {
  const tagAlternation = tagNames.join('|');

  const openingTagRe = new RegExp(
    `<(?:${tagAlternation})` +
      `(?:[^>"'\`/]|"[^"]*"|'[^']*'|\`[^\`]*\`|/(?!>))*` +
      `(?:/>|>)`,
    'gs',
  );

  const attrRe = new RegExp(
    `(\\s${escapeRegExp(attrName)}=")${escapeRegExp(fromValue)}("(?=[\\s/>]))`,
    'g',
  );

  const dynamicAttrRe = new RegExp(
    `(\\s(?:\\[${escapeRegExp(attrName)}\\]|:${escapeRegExp(attrName)})\\s*=\\s*)("([^"]*)"|'([^']*)')`,
    'g',
  );

  return source.replace(openingTagRe, (fullMatch) => {
    const withStaticReplacement = fullMatch.replace(attrRe, `$1${toValue}$2`);
    return withStaticReplacement.replace(
      dynamicAttrRe,
      (_m, prefix: string, _quotedExpression: string, doubleExpr: string | undefined, singleExpr: string | undefined) => {
        const expression = doubleExpr ?? singleExpr ?? '';
        const nextExpression = replaceQuotedStringLiterals(expression, fromValue, toValue);
        if (doubleExpr !== undefined) {
          return `${prefix}"${nextExpression}"`;
        }
        return `${prefix}'${nextExpression}'`;
      },
    );
  });
}

export function renameHtmlDynamicBindingObjectPropKey(
  source: string,
  tagNames: string[],
  attrName: string,
  fromKey: string,
  toKey: string,
  filePath?: string,
  warn?: WarnHandler,
): string {
  const tagAlternation = tagNames.join('|');

  const openingTagRe = new RegExp(
    `<(?:${tagAlternation})` +
      `(?:[^>"'\`/]|"[^"]*"|'[^']*'|\`[^\`]*\`|/(?!>))*` +
      `(?:/>|>)`,
    'gs',
  );

  const dynamicAttrRe = new RegExp(
    `(\\s(?:\\[${escapeRegExp(attrName)}\\]|:${escapeRegExp(attrName)})\\s*=\\s*)("([^"]*)"|'([^']*)')`,
    'g',
  );

  let match: RegExpExecArray | null;
  while ((match = openingTagRe.exec(source)) !== null) {
    const originalTag = match[0];
    let tagChanged = false;

    const nextTag = originalTag.replace(
      dynamicAttrRe,
      (_m, prefix: string, _quotedExpression: string, doubleExpr: string | undefined, singleExpr: string | undefined) => {
        const expression = doubleExpr ?? singleExpr ?? '';
        const { value: nextExpression, changed: expressionChanged } =
          renameObjectLiteralKeysInExpression(expression, fromKey, toKey);

        if (!expressionChanged && warn) {
          // Only warn when the expression might actually contain the key.
          // An object literal that doesn't mention fromKey is already migrated or unrelated.
          const isObjectLiteralLike = expression.trimStart().startsWith('{');
          if (!isObjectLiteralLike || expression.includes(fromKey)) {
            const lineNumber = source.substring(0, match!.index).split('\n').length;
            const location = filePath
              ? `${filePath}:${lineNumber}`
              : `line ${lineNumber}`;
            const elementName = originalTag.match(new RegExp(`^<(${tagAlternation})`))?.[1] ?? 'unknown';
            warn(
              `Manual migration needed at ${location} — ` +
              `found dynamic [${attrName}] binding on <${elementName}>. ` +
              `Could not safely rewrite expression; check for \`${fromKey}\` and rename to \`${toKey}\` manually.`,
            );
          }
        }

        if (expressionChanged) {
          tagChanged = true;
        }

        if (doubleExpr !== undefined) {
          return `${prefix}"${nextExpression}"`;
        }
        return `${prefix}'${nextExpression}'`;
      },
    );

    if (!tagChanged) continue;
    source = source.slice(0, match.index) + nextTag + source.slice(match.index + originalTag.length);
    openingTagRe.lastIndex = match.index + nextTag.length;
  }

  return source;
}

export function scanHtmlDynamicBindings(
  source: string,
  tagNames: string[],
  attrName: string,
  filePath: string,
  warn: WarnHandler,
): void {
  const tagAlternation = tagNames.join('|');

  const openingTagRe = new RegExp(
    `<(?:${tagAlternation})` +
      `(?:[^>"'\`/]|"[^"]*"|'[^']*'|\`[^\`]*\`|/(?!>))*` +
      `(?:/>|>)`,
    'gs',
  );

  const dynamicAttrRe = new RegExp(
    `(?:\\[${escapeRegExp(attrName)}\\]|:${escapeRegExp(attrName)})\\s*=\\s*["'][^"']*["']`,
    'g',
  );

  let match: RegExpExecArray | null;
  while ((match = openingTagRe.exec(source)) !== null) {
    if (!dynamicAttrRe.test(match[0])) continue;
    dynamicAttrRe.lastIndex = 0;

    const lineNumber = source.substring(0, match.index).split('\n').length;
    warn(
      `Manual migration needed at ${filePath}:${lineNumber} — ` +
      `found dynamic [${attrName}] binding on <${match[0].match(new RegExp(`^<(${tagAlternation})`))?.[1]}>. ` +
      `Angular/Vue template bindings cannot be auto-migrated. ` +
      `Check if the bound object contains \`testInterface\` and rename it to \`newProperty\` manually.`,
    );
  }
}

function replaceQuotedStringLiterals(
  expression: string,
  fromValue: string,
  toValue: string,
): string {
  const escaped = escapeRegExp(fromValue);
  return expression
    .replace(new RegExp(`"${escaped}"`, 'g'), `"${toValue}"`)
    .replace(new RegExp(`'${escaped}'`, 'g'), `'${toValue}'`)
    .replace(new RegExp(`\\x60${escaped}\\x60`, 'g'), `\`${toValue}\``);
}

function renameObjectLiteralKeysInExpression(
  expression: string,
  fromKey: string,
  toKey: string,
): RewriteOutcome {
  let next = expression;

  const explicitKeyRe = new RegExp(
    `(^|[,{]\\s*)((?:"${escapeRegExp(fromKey)}")|(?:'${escapeRegExp(fromKey)}')|${escapeRegExp(fromKey)})(?=\\s*:)`,
    'g',
  );
  next = next.replace(explicitKeyRe, (_m, prefix: string, keyToken: string) => {
    if (keyToken.startsWith('"')) return `${prefix}"${toKey}"`;
    if (keyToken.startsWith("'")) return `${prefix}'${toKey}'`;
    return `${prefix}${toKey}`;
  });

  const shorthandRe = new RegExp(
    `(^|[,{]\\s*)${escapeRegExp(fromKey)}(?=\\s*(,|}))`,
    'g',
  );
  next = next.replace(shorthandRe, `$1${toKey}: ${fromKey}`);

  return { value: next, changed: next !== expression };
}