import { renameHtmlDynamicBindingObjectPropKey } from '../../../utils/html';
import type { WarnHandler } from '../../../utils/interfaces';

const TARGET_TAGS = ['dpl-button'];
const ATTR_NAME = 'buttonConfig';
const FROM_KEY = 'testInterface';
const TO_KEY = 'newProperty';

export function transformHtml(source: string, filePath?: string, warn?: WarnHandler): string {
  return renameHtmlDynamicBindingObjectPropKey(
    source,
    TARGET_TAGS,
    ATTR_NAME,
    FROM_KEY,
    TO_KEY,
    filePath,
    warn,
  );
}

export function transform(source: string, filePath: string): string {
  if (/\.(html|vue)$/.test(filePath)) return transformHtml(source, filePath);
  return source;
}
