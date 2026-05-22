/**
 * Idempotency validator — ensures running transform twice produces the same result.
 */

export interface IdempotencyValidationResult {
  valid: boolean;
  errors: string[];
  testCases: Array<{
    description: string;
    passed: boolean;
    input: string;
    firstRun: string;
    secondRun: string;
  }>;
}

export function validateIdempotency(
  transform: (source: string, filePath: string) => string,
  testCases: Array<{ description: string; input: string; filePath: string }>,
): IdempotencyValidationResult {
  const errors: string[] = [];
  const results = testCases.map(({ description, input, filePath }) => {
    const firstRun = transform(input, filePath);
    const secondRun = transform(firstRun, filePath);
    const passed = firstRun === secondRun;

    if (!passed) {
      errors.push(
        `Idempotency failed: "${description}". Running twice produced different results.`,
      );
    }

    return {
      description,
      passed,
      input,
      firstRun,
      secondRun,
    };
  });

  return {
    valid: errors.length === 0,
    errors,
    testCases: results,
  };
}
