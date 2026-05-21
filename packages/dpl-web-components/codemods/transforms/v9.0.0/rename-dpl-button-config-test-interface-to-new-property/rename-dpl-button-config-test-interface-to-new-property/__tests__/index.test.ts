import { transformJsx } from '../index';

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
