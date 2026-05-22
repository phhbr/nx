import { parseArgv } from '../src/index';

// ---------------------------------------------------------------------------
// parseArgv
// ---------------------------------------------------------------------------

describe('parseArgv — defaults', () => {
  it('returns dryRun false by default', () => {
    expect(parseArgv([]).dryRun).toBe(false);
  });

  it('returns verbose false by default', () => {
    expect(parseArgv([]).verbose).toBe(false);
  });

  it('returns format human by default', () => {
    expect(parseArgv([]).format).toBe('human');
  });

  it('returns help false by default', () => {
    expect(parseArgv([]).help).toBe(false);
  });

  it('returns undefined dir/from/to by default', () => {
    const result = parseArgv([]);
    expect(result.dir).toBeUndefined();
    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });
});

describe('parseArgv — required flags (= syntax)', () => {
  it('parses --dir=<path>', () => {
    expect(parseArgv(['--dir=./src']).dir).toBe('./src');
  });

  it('parses --from=<version>', () => {
    expect(parseArgv(['--from=8.0.0']).from).toBe('8.0.0');
  });

  it('parses --to=<version>', () => {
    expect(parseArgv(['--to=9.0.0']).to).toBe('9.0.0');
  });
});

describe('parseArgv — required flags (space syntax)', () => {
  it('parses --dir <path>', () => {
    expect(parseArgv(['--dir', './src']).dir).toBe('./src');
  });

  it('parses --from <version>', () => {
    expect(parseArgv(['--from', '8.0.0']).from).toBe('8.0.0');
  });

  it('parses --to <version>', () => {
    expect(parseArgv(['--to', '9.0.0']).to).toBe('9.0.0');
  });
});

describe('parseArgv — boolean flags', () => {
  it('sets dryRun with --dry-run', () => {
    expect(parseArgv(['--dry-run']).dryRun).toBe(true);
  });

  it('sets dryRun with --dryRun', () => {
    expect(parseArgv(['--dryRun']).dryRun).toBe(true);
  });

  it('sets verbose with --verbose', () => {
    expect(parseArgv(['--verbose']).verbose).toBe(true);
  });

  it('sets verbose with -v', () => {
    expect(parseArgv(['-v']).verbose).toBe(true);
  });

  it('sets help with --help', () => {
    expect(parseArgv(['--help']).help).toBe(true);
  });

  it('sets help with -h', () => {
    expect(parseArgv(['-h']).help).toBe(true);
  });

  it('sets color true with --color', () => {
    expect(parseArgv(['--color']).color).toBe(true);
  });

  it('sets color false with --no-color', () => {
    expect(parseArgv(['--no-color']).color).toBe(false);
  });
});

describe('parseArgv — --format', () => {
  it('accepts --format=json', () => {
    expect(parseArgv(['--format=json']).format).toBe('json');
  });

  it('accepts --format=human', () => {
    expect(parseArgv(['--format=human']).format).toBe('human');
  });

  it('ignores unknown format values', () => {
    expect(parseArgv(['--format=xml']).format).toBe('human');
  });
});

describe('parseArgv — --only', () => {
  it('parses a single migration id', () => {
    expect(parseArgv(['--only=rename-prop']).only).toEqual(['rename-prop']);
  });

  it('parses comma-separated migration ids', () => {
    expect(parseArgv(['--only=rename-prop,rename-attr']).only).toEqual([
      'rename-prop',
      'rename-attr',
    ]);
  });

  it('trims whitespace around ids', () => {
    expect(parseArgv(['--only=rename-prop , rename-attr']).only).toEqual([
      'rename-prop',
      'rename-attr',
    ]);
  });

  it('filters out empty entries', () => {
    expect(parseArgv(['--only=rename-prop,']).only).toEqual(['rename-prop']);
  });
});

describe('parseArgv — combined flags', () => {
  it('parses a realistic full command line', () => {
    const result = parseArgv([
      '--from=8.0.0',
      '--to=9.0.0',
      '--dir=./src',
      '--dry-run',
      '--verbose',
      '--format=json',
      '--only=rename-prop,rename-attr',
    ]);
    expect(result).toMatchObject({
      from: '8.0.0',
      to: '9.0.0',
      dir: './src',
      dryRun: true,
      verbose: true,
      format: 'json',
      only: ['rename-prop', 'rename-attr'],
    });
  });
});
