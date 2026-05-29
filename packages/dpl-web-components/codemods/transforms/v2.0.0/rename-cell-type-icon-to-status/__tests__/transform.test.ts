import { describe, expect, it } from '@jest/globals';
import { transform } from '../index';

describe('rename-cell-type-icon-to-status transform', () => {
  it('renames type and converts string value to status object', () => {
    const input = "const cells = [{ type: 'icon', value: 'check-circle' }];";

    const output = transform(input, 'table.ts');

    expect(output).toContain("type: 'status'");
    expect(output).toContain(
      "value: { icon: 'check-circle', text: 'check-circle', color: 'gray' }",
    );
  });

  it('renames type but leaves dynamic value expressions unchanged', () => {
    const input = "const cells = [{ type: 'icon', value: iconName }];";

    const output = transform(input, 'table.ts');

    expect(output).toContain("type: 'status'");
    expect(output).toContain('value: iconName');
  });

  it('is idempotent when applied multiple times', () => {
    const input = "const cells = [{ type: 'icon', value: 'check-circle' }];";

    const firstPass = transform(input, 'table.ts');
    const secondPass = transform(firstPass, 'table.ts');

    expect(secondPass).toBe(firstPass);
  });

  it('does not transform unsupported file extensions', () => {
    const input = "const cells = [{ type: 'icon', value: 'check-circle' }];";

    const output = transform(input, 'README.md');

    expect(output).toBe(input);
  });
});
