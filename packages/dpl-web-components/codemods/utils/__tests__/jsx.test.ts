import { renameJsxObjectPropKey, replaceJsxStringAttr } from '../jsx';

describe('JsxUtils', () => {
  describe('replaceJsxStringAttr', () => {
    it('replaces static string literal attributes on matching tags', () => {
      const input = '<dpl-button variant="outline" />';
      const output = replaceJsxStringAttr(input, ['dpl-button'], 'variant', 'outline', 'ghost');
      expect(output).toContain('variant="ghost"');
      expect(output).not.toContain('variant="outline"');
    });

    it('rewrites string literals inside JSX expression containers', () => {
      const input = '<dpl-button variant={isPrimary ? "outline" : "solid"} />';
      const output = replaceJsxStringAttr(input, ['dpl-button'], 'variant', 'outline', 'ghost');
      expect(output).toContain('"ghost"');
      expect(output).toContain('"solid"');
    });

    it('does not touch non-target elements', () => {
      const input = '<other-button variant="outline" />';
      const output = replaceJsxStringAttr(input, ['dpl-button'], 'variant', 'outline', 'ghost');
      expect(output).toBe(input);
    });
  });

  describe('renameJsxObjectPropKey', () => {
    it('renames keys in inline object literals', () => {
      const input = '<dpl-button buttonConfig={{ testInterface: data, title: "T" }} />';
      const output = renameJsxObjectPropKey(
        input,
        ['dpl-button'],
        'buttonConfig',
        'testInterface',
        'newProperty',
      );

      expect(output).toContain('newProperty: data');
      expect(output).not.toContain('testInterface: data');
    });

    it('expands shorthand properties while renaming', () => {
      const input = '<dpl-button buttonConfig={{ testInterface, title: "T" }} />';
      const output = renameJsxObjectPropKey(
        input,
        ['dpl-button'],
        'buttonConfig',
        'testInterface',
        'newProperty',
      );

      expect(output).toContain('newProperty: testInterface');
    });

    it('warns when a non-inline reference cannot be rewritten safely', () => {
      const warn = jest.fn<void, [string]>();
      const input = '<dpl-button buttonConfig={externalConfig} />';
      const output = renameJsxObjectPropKey(
        input,
        ['dpl-button'],
        'buttonConfig',
        'testInterface',
        'newProperty',
        'src/component.tsx',
        warn,
      );

      expect(output).toBe(input);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('src/component.tsx');
      expect(warn.mock.calls[0][0]).toContain('testInterface');
      expect(warn.mock.calls[0][0]).toContain('newProperty');
    });
  });
});
