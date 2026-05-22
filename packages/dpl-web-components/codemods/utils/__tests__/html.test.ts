import {
  renameHtmlDynamicBindingObjectPropKey,
  replaceHtmlAttr,
  scanHtmlDynamicBindings,
} from '../html';

describe('HtmlUtils', () => {
  describe('replaceHtmlAttr', () => {
    it('replaces static attributes on matching tags', () => {
      const input = '<dpl-button variant="outline"></dpl-button>';
      const output = replaceHtmlAttr(input, ['dpl-button'], 'variant', 'outline', 'ghost');
      expect(output).toBe('<dpl-button variant="ghost"></dpl-button>');
    });

    it('rewrites string literals in Angular and Vue dynamic bindings', () => {
      const input = [
        '<dpl-button [variant]="\'outline\'"></dpl-button>',
        '<dpl-button :variant="isPrimary ? \'outline\' : \'solid\'"></dpl-button>',
      ].join('\n');

      const output = replaceHtmlAttr(input, ['dpl-button'], 'variant', 'outline', 'ghost');
      expect(output).toContain("[variant]=\"'ghost'\"");
      expect(output).toContain(":variant=\"isPrimary ? 'ghost' : 'solid'\"");
    });
  });

  describe('renameHtmlDynamicBindingObjectPropKey', () => {
    it('renames object-literal keys in dynamic bindings', () => {
      const input = '<dpl-button [buttonConfig]="{ testInterface: data, title: \"T\" }"></dpl-button>';
      const output = renameHtmlDynamicBindingObjectPropKey(
        input,
        ['dpl-button'],
        'buttonConfig',
        'testInterface',
        'newProperty',
      );

      expect(output).toContain('newProperty: data');
      expect(output).not.toContain('testInterface: data');
    });

    it('does not warn on already-migrated object literals', () => {
      const warn = jest.fn<void, [string]>();
      const input = '<dpl-button [buttonConfig]="{ newProperty: data }"></dpl-button>';
      const output = renameHtmlDynamicBindingObjectPropKey(
        input,
        ['dpl-button'],
        'buttonConfig',
        'testInterface',
        'newProperty',
        'src/app.component.html',
        warn,
      );

      expect(output).toBe(input);
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns when expression cannot be safely rewritten', () => {
      const warn = jest.fn<void, [string]>();
      const input = '<dpl-button [buttonConfig]="externalConfig"></dpl-button>';
      const output = renameHtmlDynamicBindingObjectPropKey(
        input,
        ['dpl-button'],
        'buttonConfig',
        'testInterface',
        'newProperty',
        'src/app.component.html',
        warn,
      );

      expect(output).toBe(input);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('src/app.component.html');
    });
  });

  describe('scanHtmlDynamicBindings', () => {
    it('reports dynamic bindings for manual migration', () => {
      const warn = jest.fn<void, [string]>();
      const input = '<dpl-button [buttonConfig]="configVar"></dpl-button>';

      scanHtmlDynamicBindings(
        input,
        ['dpl-button'],
        'buttonConfig',
        'src/app.component.html',
        warn,
      );

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('src/app.component.html');
      expect(warn.mock.calls[0][0]).toContain('testInterface');
      expect(warn.mock.calls[0][0]).toContain('newProperty');
    });
  });
});
