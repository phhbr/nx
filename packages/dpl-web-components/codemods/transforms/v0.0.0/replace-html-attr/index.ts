import { replaceHtmlAttr } from '../../../utils/html';

const TARGET_TAGS = ['dpl-button'];
const ATTR_NAME = 'variant';
const FROM_VALUE = 'outline';
const TO_VALUE = 'ghost';

export function transformHtml(source: string): string {
  return replaceHtmlAttr(source, TARGET_TAGS, ATTR_NAME, FROM_VALUE, TO_VALUE);
}

export function transform(source: string, filePath: string): string {
  if (/\.(html|vue)$/.test(filePath)) return transformHtml(source);
  return source;
}
