import { transformJsx, transformHtml } from '../index';

// ---------------------------------------------------------------------------
// Primary transformation — identifier key
// ---------------------------------------------------------------------------
describe('rename testInterface → newProperty — identifier key', () => {
  it('renames testInterface in an inline buttonConfig object on dpl-button', () => {
    const input = `<dpl-button buttonConfig={{ testInterface: foo, title: 'T', id: '1' }} />`;
    const output = `<dpl-button buttonConfig={{ newProperty: foo, title: 'T', id: '1' }} />`;
    expect(transformJsx(input)).toBe(output);
  });

  it('renames testInterface in an inline buttonConfig object on DplButton', () => {
    const input = `<DplButton buttonConfig={{ testInterface: foo, title: 'T', id: '1' }} />`;
    const output = `<DplButton buttonConfig={{ newProperty: foo, title: 'T', id: '1' }} />`;
    expect(transformJsx(input)).toBe(output);
  });

  it('renames testInterface when it is the only property', () => {
    const input = `<dpl-button buttonConfig={{ testInterface: someValue }} />`;
    const output = `<dpl-button buttonConfig={{ newProperty: someValue }} />`;
    expect(transformJsx(input)).toBe(output);
  });

  it('handles multiple dpl-button elements in one file', () => {
    const input = [
      `<dpl-button buttonConfig={{ testInterface: a, title: 'A', id: '1' }} />`,
      `<dpl-button buttonConfig={{ testInterface: b, title: 'B', id: '2' }} />`,
    ].join('\n');
    const expected = [
      `<dpl-button buttonConfig={{ newProperty: a, title: 'A', id: '1' }} />`,
      `<dpl-button buttonConfig={{ newProperty: b, title: 'B', id: '2' }} />`,
    ].join('\n');
    expect(transformJsx(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Shorthand property expansion
// ---------------------------------------------------------------------------
describe('rename testInterface → newProperty — shorthand property', () => {
  it('expands shorthand { testInterface } to { newProperty: testInterface }', () => {
    const input = `<dpl-button buttonConfig={{ testInterface, title: 'T', id: '1' }} />`;
    const output = `<dpl-button buttonConfig={{ newProperty: testInterface, title: 'T', id: '1' }} />`;
    expect(transformJsx(input)).toBe(output);
  });
});

// ---------------------------------------------------------------------------
// String-literal key
// ---------------------------------------------------------------------------
describe('rename testInterface → newProperty — string literal key', () => {
  it('renames "testInterface" (string literal key) to newProperty', () => {
    const input = `<dpl-button buttonConfig={{ "testInterface": foo, title: 'T', id: '1' }} />`;
    const output = `<dpl-button buttonConfig={{ newProperty: foo, title: 'T', id: '1' }} />`;
    expect(transformJsx(input)).toBe(output);
  });
});

// ---------------------------------------------------------------------------
// No-op cases
// ---------------------------------------------------------------------------
describe('rename testInterface → newProperty — no-op', () => {
  it('does NOT touch variable reference buttonConfig (no inline object)', () => {
    const input = `<dpl-button buttonConfig={someConfig} />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does NOT touch buttonConfig when already using newProperty (idempotent)', () => {
    const input = `<dpl-button buttonConfig={{ newProperty: foo, title: 'T', id: '1' }} />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does NOT rename testInterface in an unrelated component', () => {
    const input = `<SomeOtherComponent buttonConfig={{ testInterface: foo }} />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does NOT rename testInterface in a different attribute on dpl-button', () => {
    const input = `<dpl-button someOtherProp={{ testInterface: foo }} />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does NOT rename a computed key [testInterface]', () => {
    const input = `<dpl-button buttonConfig={{ [testInterface]: foo }} />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does not modify other properties in the object', () => {
    const input = `<dpl-button buttonConfig={{ testInterface: foo, title: 'Keep', id: '42', isActive: true }} />`;
    const output = transformJsx(input);
    expect(output).toContain('newProperty: foo');
    expect(output).toContain("title: 'Keep'");
    expect(output).toContain("id: '42'");
    expect(output).toContain('isActive: true');
  });
});

// ---------------------------------------------------------------------------
// Warnings — JSX variable references
// ---------------------------------------------------------------------------
describe('rename testInterface → newProperty — warns on variable reference', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => { warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warnSpy.mockRestore(); });

  it('emits a warning when buttonConfig is a variable reference', () => {
    transformJsx(`<dpl-button buttonConfig={someConfig} />`, 'src/Button.tsx');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('src/Button.tsx');
    expect(warnSpy.mock.calls[0][0]).toContain('testInterface');
    expect(warnSpy.mock.calls[0][0]).toContain('newProperty');
  });

  it('emits a warning for a function call reference', () => {
    transformJsx(`<dpl-button buttonConfig={buildConfig()} />`, 'src/Form.tsx');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('src/Form.tsx');
  });

  it('emits one warning per non-inline reference found', () => {
    const input = [
      `<dpl-button buttonConfig={configA} />`,
      `<dpl-button buttonConfig={configB} />`,
    ].join('\n');
    transformJsx(input, 'src/Page.tsx');
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it('does NOT warn for inline object literals (those are auto-transformed)', () => {
    transformJsx(`<dpl-button buttonConfig={{ testInterface: foo }} />`, 'src/Button.tsx');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does NOT warn for unrelated components with a non-inline buttonConfig', () => {
    transformJsx(`<SomeOther buttonConfig={someConfig} />`, 'src/Other.tsx');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('includes the line number in the warning when available', () => {
    const input = `const x = 1;\n<dpl-button buttonConfig={someConfig} />`;
    transformJsx(input, 'src/Button.tsx');
    expect(warnSpy.mock.calls[0][0]).toMatch(/src\/Button\.tsx:\d+/);
  });
});

// ---------------------------------------------------------------------------
// Warnings — HTML/Vue dynamic bindings
// ---------------------------------------------------------------------------
describe('rename testInterface → newProperty — warns on HTML dynamic bindings', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => { warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); });
  afterEach(() => { warnSpy.mockRestore(); });

  it('emits a warning for Angular [buttonConfig]="..." binding on dpl-button', () => {
    const input = `<dpl-button [buttonConfig]="someConfig"></dpl-button>`;
    transformHtml(input, 'src/app.component.html');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('src/app.component.html');
    expect(warnSpy.mock.calls[0][0]).toContain('testInterface');
    expect(warnSpy.mock.calls[0][0]).toContain('newProperty');
  });

  it('emits a warning for Vue :buttonConfig="..." binding on dpl-button', () => {
    const input = `<dpl-button :buttonConfig="someConfig"></dpl-button>`;
    transformHtml(input, 'src/MyComponent.vue');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('src/MyComponent.vue');
  });

  it('does NOT warn for static buttonConfig="..." (not a dynamic binding)', () => {
    const input = `<dpl-button buttonConfig="staticValue"></dpl-button>`;
    transformHtml(input, 'src/app.component.html');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does NOT warn for dynamic bindings on unrelated components', () => {
    const input = `<some-other [buttonConfig]="someConfig"></some-other>`;
    transformHtml(input, 'src/app.component.html');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns the source unchanged', () => {
    const input = `<dpl-button [buttonConfig]="someConfig"></dpl-button>`;
    expect(transformHtml(input, 'src/app.component.html')).toBe(input);
  });
});
