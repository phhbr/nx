import { transformJsx, transformHtml, transform } from '../index';

// ---------------------------------------------------------------------------
// JSX / TSX — self-closing
// ---------------------------------------------------------------------------

describe('transformJsx — self-closing', () => {
  it('replaces variant="outline" with variant="ghost" on dpl-button', () => {
    const input = `<dpl-button variant="outline" disabled />`;
    const output = `<dpl-button variant="ghost" disabled />`;
    expect(transformJsx(input)).toBe(output);
  });

  it('replaces variant="outline" on DplButton (Angular wrapper component name)', () => {
    const input = `<DplButton variant="outline" />`;
    const output = `<DplButton variant="ghost" />`;
    expect(transformJsx(input)).toBe(output);
  });

  it('handles multiple occurrences in one file', () => {
    // Use a single-root JSX tree to avoid parser issues with adjacent elements
    const input = `function App() {
  return (
    <div>
      <dpl-button variant="outline" />
      <dpl-button variant="outline" label="Save" />
    </div>
  );
}`;
    const result = transformJsx(input);
    // Both outline → ghost
    expect(result).not.toContain('variant="outline"');
    expect((result.match(/variant="ghost"/g) ?? []).length).toBe(2);
    // Other attrs preserved
    expect(result).toContain('label="Save"');
  });

  it('handles variant attribute in the middle of multiple props', () => {
    const input = `<dpl-button disabled variant="outline" onClick={handler} />`;
    const output = `<dpl-button disabled variant="ghost" onClick={handler} />`;
    expect(transformJsx(input)).toBe(output);
  });
});

// ---------------------------------------------------------------------------
// JSX / TSX — non-self-closing
// ---------------------------------------------------------------------------

describe('transformJsx — non-self-closing', () => {
  it('replaces variant="outline" inside open/close pair', () => {
    const input = `<dpl-button variant="outline">Click me</dpl-button>`;
    const output = `<dpl-button variant="ghost">Click me</dpl-button>`;
    expect(transformJsx(input)).toBe(output);
  });

  it('handles nested content between open/close tags', () => {
    const input = `<dpl-button variant="outline"><span>Label</span></dpl-button>`;
    const output = `<dpl-button variant="ghost"><span>Label</span></dpl-button>`;
    expect(transformJsx(input)).toBe(output);
  });
});

// ---------------------------------------------------------------------------
// JSX / TSX — no-op cases
// ---------------------------------------------------------------------------

describe('transformJsx — no-op', () => {
  it('does NOT change variant="ghost" (already correct — idempotency)', () => {
    const input = `<dpl-button variant="ghost" />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does NOT change dynamic variant={someVar}', () => {
    const input = `<dpl-button variant={someVar} />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('changes dynamic variant={"outline"} expression container', () => {
    const input = `<dpl-button variant={"outline"} />`;
    const output = `<dpl-button variant={"ghost"} />`;
    expect(transformJsx(input)).toBe(output);
  });

  it('changes string literals inside dynamic expressions for variant', () => {
    const input = `<dpl-button variant={isPrimary ? "outline" : "solid"} />`;
    const output = `<dpl-button variant={isPrimary ? "ghost" : "solid"} />`;
    expect(transformJsx(input)).toBe(output);
  });

  it('does NOT change unrelated components that have variant="outline"', () => {
    const input = `<SomeOtherButton variant="outline" />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does NOT change other props on dpl-button', () => {
    const input = `<dpl-button disabled={true} label="Submit" />`;
    expect(transformJsx(input)).toBe(input);
  });

  it('does NOT change text content that contains "outline"', () => {
    const input = `<dpl-button>variant="outline"</dpl-button>`;
    expect(transformJsx(input)).toBe(input);
  });

  it('leaves unrelated sibling elements unchanged', () => {
    const input = `function App() {
  return (
    <div>
      <SomeOtherButton variant="outline" />
      <dpl-button variant="outline" />
    </div>
  );
}`;
    const result = transformJsx(input);
    // dpl-button is transformed
    expect(result).toContain('<dpl-button variant="ghost"');
    // SomeOtherButton is NOT touched
    expect(result).toContain('<SomeOtherButton variant="outline"');
  });
});

// ---------------------------------------------------------------------------
// HTML templates — self-closing
// ---------------------------------------------------------------------------

describe('transformHtml — self-closing', () => {
  it('replaces variant="outline" in a self-closing HTML tag', () => {
    const input = `<dpl-button variant="outline" />`;
    const output = `<dpl-button variant="ghost" />`;
    expect(transformHtml(input)).toBe(output);
  });

  it('replaces variant="outline" on DplButton self-closing', () => {
    const input = `<DplButton variant="outline" />`;
    const output = `<DplButton variant="ghost" />`;
    expect(transformHtml(input)).toBe(output);
  });
});

// ---------------------------------------------------------------------------
// HTML templates — non-self-closing
// ---------------------------------------------------------------------------

describe('transformHtml — non-self-closing', () => {
  it('replaces variant="outline" in an open/close HTML pair', () => {
    const input = `<dpl-button variant="outline">Label</dpl-button>`;
    const output = `<dpl-button variant="ghost">Label</dpl-button>`;
    expect(transformHtml(input)).toBe(output);
  });

  it('handles multi-line attributes', () => {
    const input = [
      `<dpl-button`,
      `  variant="outline"`,
      `  disabled`,
      `>`,
      `</dpl-button>`,
    ].join('\n');
    const expected = [
      `<dpl-button`,
      `  variant="ghost"`,
      `  disabled`,
      `>`,
      `</dpl-button>`,
    ].join('\n');
    expect(transformHtml(input)).toBe(expected);
  });

  it('handles multiple occurrences in one HTML file', () => {
    const input = [
      `<dpl-button variant="outline">First</dpl-button>`,
      `<dpl-button variant="outline">Second</dpl-button>`,
    ].join('\n');
    const expected = [
      `<dpl-button variant="ghost">First</dpl-button>`,
      `<dpl-button variant="ghost">Second</dpl-button>`,
    ].join('\n');
    expect(transformHtml(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// HTML templates — no-op cases
// ---------------------------------------------------------------------------

describe('transformHtml — no-op', () => {
  it('does NOT change variant="ghost" (already correct)', () => {
    const input = `<dpl-button variant="ghost" />`;
    expect(transformHtml(input)).toBe(input);
  });

  it('does NOT change unrelated components', () => {
    const input = `<some-other-button variant="outline" />`;
    expect(transformHtml(input)).toBe(input);
  });

  it('does NOT change text content between tags', () => {
    const input = `<dpl-button>variant="outline"</dpl-button>`;
    expect(transformHtml(input)).toBe(input);
  });

  it('does NOT affect Angular-style property bindings', () => {
    const input = `<dpl-button [variant]="outline" />`;
    expect(transformHtml(input)).toBe(input);
  });

  it('rewrites Angular dynamic binding string literals', () => {
    const input = `<dpl-button [variant]="'outline'" />`;
    const output = `<dpl-button [variant]="'ghost'" />`;
    expect(transformHtml(input)).toBe(output);
  });

  it('rewrites Vue dynamic binding string literals', () => {
    const input = `<dpl-button :variant="isPrimary ? 'outline' : 'solid'" />`;
    const output = `<dpl-button :variant="isPrimary ? 'ghost' : 'solid'" />`;
    expect(transformHtml(input)).toBe(output);
  });
});

// ---------------------------------------------------------------------------
// Unified transform() — extension routing
// ---------------------------------------------------------------------------

describe('transform() routing', () => {
  it('routes .tsx files to JSX transform', () => {
    const input = `<dpl-button variant="outline" />`;
    const output = `<dpl-button variant="ghost" />`;
    expect(transform(input, '/some/path/component.tsx')).toBe(output);
  });

  it('routes .jsx files to JSX transform', () => {
    const input = `<dpl-button variant="outline" />`;
    const output = `<dpl-button variant="ghost" />`;
    expect(transform(input, '/some/path/component.jsx')).toBe(output);
  });

  it('routes .ts files to JSX transform (may contain JSX in Stencil)', () => {
    const input = `<dpl-button variant="outline" />`;
    const output = `<dpl-button variant="ghost" />`;
    expect(transform(input, '/some/path/component.ts')).toBe(output);
  });

  it('routes .html files to HTML transform', () => {
    const input = `<dpl-button variant="outline" />`;
    const output = `<dpl-button variant="ghost" />`;
    expect(transform(input, '/some/path/template.html')).toBe(output);
  });

  it('routes .vue files to HTML transform', () => {
    const input = `<template>\n  <dpl-button variant="outline" />\n</template>`;
    const output = `<template>\n  <dpl-button variant="ghost" />\n</template>`;
    expect(transform(input, '/some/path/component.vue')).toBe(output);
  });

  it('passes through unknown extensions unchanged', () => {
    const input = `<dpl-button variant="outline" />`;
    expect(transform(input, '/some/path/file.md')).toBe(input);
  });
});
