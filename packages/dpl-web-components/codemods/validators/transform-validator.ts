/**
 * Transform module validator — ensures transforms export correct functions and have valid syntax.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface TransformValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  hasTransformJsx: boolean;
  hasTransformHtml: boolean;
  hasTransform: boolean;
}

export function validateTransformModule(transformPath: string): TransformValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(transformPath)) {
    return {
      valid: false,
      errors: [`Transform file not found: ${transformPath}`],
      warnings: [],
      hasTransform: false,
      hasTransformJsx: false,
      hasTransformHtml: false,
    };
  }

  const content = fs.readFileSync(transformPath, 'utf8');

  // Check for syntax errors (basic check)
  try {
    new Function(content);
  } catch (e) {
    errors.push(`Syntax error in transform: ${(e as Error).message}`);
  }

  // Check for required exports
  const hasTransform = /export\s+function\s+transform\s*\(/.test(content);
  const hasTransformJsx = /export\s+function\s+transformJsx\s*\(/.test(content);
  const hasTransformHtml = /export\s+function\s+transformHtml\s*\(/.test(content);

  if (!hasTransform) {
    errors.push('Missing required export: function transform(source, filePath)');
  }

  // At least one of these should be implemented (or both could call transform)
  if (!hasTransformJsx && !hasTransformHtml) {
    warnings.push('No transformJsx or transformHtml functions found. They may be handled in transform().');
  }

  // Check that function signatures are correct
  if (hasTransform && !/transform\s*\(\s*source\s*:\s*string\s*,\s*filePath\s*:\s*string\s*\)/.test(content)) {
    warnings.push('transform() signature looks non-standard. Expected: (source: string, filePath: string) => string');
  }

  // Check for common mistakes
  if (/return\s+source/.test(content) && content.match(/return\s+source/g)!.length >= 3) {
    // This is likely okay (multiple fallback returns)
  }

  // Check if transform could be idempotent
  if (!content.includes('filePath')) {
    warnings.push(
      'Transform does not use filePath parameter. This is fine if the transform is file-type agnostic.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    hasTransform,
    hasTransformJsx,
    hasTransformHtml,
  };
}
