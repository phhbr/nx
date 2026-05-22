import { Formatter } from '../src/formatter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormatter(opts?: ConstructorParameters<typeof Formatter>[0]) {
  return new Formatter({ color: false, ...opts });
}

// ---------------------------------------------------------------------------
// Constructor defaults
// ---------------------------------------------------------------------------

describe('Formatter — constructor', () => {
  it('defaults to human format', () => {
    const f = makeFormatter();
    f.info('hello');
    expect(f.getLogs()[0].level).toBe('info');
  });

  it('defaults verbose to false', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const f = makeFormatter();
    f.debug('quiet');
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Logging levels
// ---------------------------------------------------------------------------

describe('Formatter — log levels', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('logs info messages', () => {
    const f = makeFormatter();
    f.info('info message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('info message');
  });

  it('logs warn messages', () => {
    const f = makeFormatter();
    f.warn('warn message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('warn message');
  });

  it('logs error messages', () => {
    const f = makeFormatter();
    f.error('error message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('error message');
  });

  it('suppresses debug messages when verbose is false', () => {
    const f = makeFormatter({ verbose: false });
    f.debug('secret');
    expect(spy).not.toHaveBeenCalled();
  });

  it('prints debug messages when verbose is true', () => {
    const f = makeFormatter({ verbose: true });
    f.debug('debug message');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('debug message');
  });
});

// ---------------------------------------------------------------------------
// getLogs
// ---------------------------------------------------------------------------

describe('Formatter — getLogs', () => {
  it('returns all collected logs', () => {
    const f = makeFormatter();
    f.info('a');
    f.warn('b');
    f.error('c');
    const logs = f.getLogs();
    expect(logs).toHaveLength(3);
    expect(logs.map((l) => l.level)).toEqual(['info', 'warn', 'error']);
  });

  it('includes message and timestamp on each log entry', () => {
    const f = makeFormatter();
    f.info('test message');
    const [entry] = f.getLogs();
    expect(entry.message).toBe('test message');
    expect(entry.timestamp).toBeDefined();
  });

  it('includes context when provided', () => {
    const f = makeFormatter();
    f.info('with context', { foo: 'bar' });
    const [entry] = f.getLogs();
    expect(entry.context).toEqual({ foo: 'bar' });
  });

  it('returns a copy — mutations do not affect internal state', () => {
    const f = makeFormatter();
    f.info('original');
    const logs = f.getLogs();
    logs.push({ level: 'error', message: 'injected' });
    expect(f.getLogs()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// JSON format mode
// ---------------------------------------------------------------------------

describe('Formatter — JSON format', () => {
  let stdoutSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    stderrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('does not print individual log entries to stderr in non-verbose JSON mode', () => {
    const f = makeFormatter({ format: 'json', verbose: false });
    f.info('silent in json');
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('prints individual entries to stderr in verbose JSON mode', () => {
    const f = makeFormatter({ format: 'json', verbose: true });
    f.info('verbose json log');
    expect(stderrSpy).toHaveBeenCalled();
    const parsed = JSON.parse(stderrSpy.mock.calls[0][0]);
    expect(parsed.message).toBe('verbose json log');
  });

  it('result() outputs valid JSON to stdout', () => {
    const f = makeFormatter({ format: 'json' });
    f.result({ filesScanned: 3, filesModified: 1 });
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.result.filesScanned).toBe(3);
    expect(output.result.filesModified).toBe(1);
    expect(typeof output.duration).toBe('number');
  });

  it('result() sets success false when an error was logged', () => {
    const f = makeFormatter({ format: 'json' });
    f.error('something broke');
    f.result({});
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.success).toBe(false);
  });

  it('result() sets success true when no errors were logged', () => {
    const f = makeFormatter({ format: 'json' });
    f.info('all good');
    f.result({});
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.success).toBe(true);
  });

  it('result() omits logs array in non-verbose mode', () => {
    const f = makeFormatter({ format: 'json', verbose: false });
    f.info('msg');
    f.result({});
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.logs).toEqual([]);
  });

  it('result() includes logs array in verbose mode', () => {
    const f = makeFormatter({ format: 'json', verbose: true });
    f.info('msg');
    f.result({});
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.logs).toHaveLength(1);
    expect(output.logs[0].message).toBe('msg');
  });

  it('result() respects a provided duration override', () => {
    const f = makeFormatter({ format: 'json' });
    f.result({}, 42);
    const output = JSON.parse(stdoutSpy.mock.calls[0][0]);
    expect(output.duration).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Human format — result()
// ---------------------------------------------------------------------------

describe('Formatter — human result()', () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('prints key-value pairs', () => {
    const f = makeFormatter({ format: 'human' });
    f.result({ filesScanned: 5, filesModified: 2 });
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('filesScanned: 5');
    expect(output).toContain('filesModified: 2');
  });

  it('prints array items indented', () => {
    const f = makeFormatter({ format: 'human' });
    f.result({ migrations: [{ id: 'foo', filesModified: 1 }] });
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('migrations:');
    expect(output).toContain('foo');
  });

  it('includes a duration line', () => {
    const f = makeFormatter({ format: 'human' });
    f.result({}, 500);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('500ms');
  });

  it('formats sub-second duration as ms', () => {
    const f = makeFormatter({ format: 'human' });
    f.result({}, 750);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/750ms/);
  });

  it('formats seconds-range duration with two decimal places', () => {
    const f = makeFormatter({ format: 'human' });
    f.result({}, 2500);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/2\.50s/);
  });

  it('formats minute-range duration as Xm Ys', () => {
    const f = makeFormatter({ format: 'human' });
    f.result({}, 90000);
    const output = spy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toMatch(/1m 30s/);
  });
});
