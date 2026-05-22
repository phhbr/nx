import { replaceJsxStringAttr } from '../../../utils/jsx';

const TARGET_TAGS = ['dpl-button', 'DplButton'];
const ATTR_NAME = 'variant';
const FROM_VALUE = 'outline';
const TO_VALUE = 'ghost';

export function transformJsx(source: string): string {
  return replaceJsxStringAttr(source, TARGET_TAGS, ATTR_NAME, FROM_VALUE, TO_VALUE);
}

export function transform(source: string, filePath: string): string {
  if (/\.[jt]sx?$/.test(filePath)) return transformJsx(source);
  return source;
}
