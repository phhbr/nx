/**
 * Safety validator — checks that transforms don't corrupt code or introduce issues.
 */

export interface SafetyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Checks that:
 * - Input and output are both valid (have some content)
 * - Transform doesn't delete too much (no more than 50% of file)
 * - Output still has balanced delimiters
 * - No introduction of undefined/null values
 */
export function validateSafety(
  input: string,
  output: string,
  filePath: string,
): SafetyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty output
  if (output.trim().length === 0 && input.trim().length > 0) {
    errors.push(`Safety: Transform deleted all content from ${filePath}`);
  }

  // Check for excessive deletions
  const deletionRatio = 1 - output.length / input.length;
  if (deletionRatio > 0.5) {
    warnings.push(
      `Safety: Transform deleted more than 50% of file (${Math.round(deletionRatio * 100)}%). Review carefully.`,
    );
  }

  // Check for additions only (might be a sign of duplicate)
  if (output.length > input.length * 2) {
    warnings.push(
      `Safety: Output is more than 2x the input size. Check for accidental duplication.`,
    );
  }

  // Check for balanced delimiters in JS/TS files
  if (/\.[jt]sx?$/.test(filePath)) {
    const brackets = { '{': '}', '[': ']', '(': ')' };
    const counts = { '{': 0, '[': 0, '(': 0 };

    for (const char of output) {
      if (char in counts) counts[char as keyof typeof counts]++;
      if (char in brackets) {
        const opener = Object.keys(brackets).find((k) => brackets[k as keyof typeof brackets] === char);
        if (opener) counts[opener as keyof typeof counts]--;
      }
    }

    for (const [bracket, count] of Object.entries(counts)) {
      if (count !== 0) {
        warnings.push(
          `Safety: Unbalanced ${bracket}...${brackets[bracket as keyof typeof brackets]} in output (net: ${count}). May indicate a corrupt transformation.`,
        );
      }
    }
  }

  // Check for common corruption patterns
  const suspiciousPatterns = [
    { pattern: /undefined/g, name: 'undefined literal' },
    { pattern: /null/g, name: 'null literal' },
    { pattern: /\{\s*\}/g, name: 'empty object' },
    { pattern: /\[\s*\]/g, name: 'empty array' },
  ];

  for (const { pattern, name } of suspiciousPatterns) {
    const inputCount = (input.match(pattern) || []).length;
    const outputCount = (output.match(pattern) || []).length;
    if (outputCount > inputCount * 2) {
      warnings.push(`Safety: Output has many instances of "${name}" (${outputCount}). Verify correctness.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
