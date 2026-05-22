import { renameJsxObjectPropKey } from '../../../utils/jsx';
import type { WarnHandler } from '../../../utils/interfaces';

const TARGET_TAGS = ['dpl-button', 'DplButton'];
const ATTR_NAME = 'buttonConfig';
const FROM_KEY = 'testInterface';
const TO_KEY = 'newProperty';

export function transformJsx(source: string, filePath?: string, warn?: WarnHandler): string {
  return renameJsxObjectPropKey(source, TARGET_TAGS, ATTR_NAME, FROM_KEY, TO_KEY, filePath, warn);
}

export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) return transformJsx(source, filePath);
  return source;
}
