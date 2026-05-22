/**
 * Shared CLI formatter for codemods and validation tools.
 * Supports both human-readable and JSON output modes.
 */

export interface FormatterOptions {
  format?: 'human' | 'json';
  verbose?: boolean;
  color?: boolean;
}

export interface LogLevel {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  timestamp?: string;
}

export class Formatter {
  private format: 'human' | 'json';
  private verbose: boolean;
  private color: boolean;
  private logs: LogLevel[] = [];
  private startTime: number;

  constructor(options: FormatterOptions = {}) {
    this.format = options.format ?? 'human';
    this.verbose = options.verbose ?? false;
    this.color = options.color ?? process.stdout.isTTY;
    this.startTime = Date.now();
  }

  log(level: LogLevel['level'], message: string, context?: Record<string, unknown>): void {
    const entry: LogLevel = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(entry);

    if (this.format === 'json') {
      // Don't log individual entries in JSON mode — they'll be batched at the end
      if (this.verbose) {
        console.error(JSON.stringify(entry));
      }
    } else {
      // Human-readable output
      if (level === 'debug' && !this.verbose) return;
      this.printHuman(entry);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  private printHuman(entry: LogLevel): void {
    const icon = this.getIcon(entry.level);
    const color = this.getColor(entry.level);
    const reset = this.color ? '\x1b[0m' : '';
    const colorCode = this.color ? color : '';

    const parts = [colorCode, icon, ' ', entry.message, reset];

    if (this.verbose && entry.context) {
      parts.push('\n  ', JSON.stringify(entry.context, null, 2).split('\n').join('\n  '));
    }

    console.error(parts.join(''));
  }

  private getIcon(level: LogLevel['level']): string {
    switch (level) {
      case 'debug':
        return '🔍';
      case 'info':
        return 'ℹ️ ';
      case 'warn':
        return '⚠️ ';
      case 'error':
        return '❌';
    }
  }

  private getColor(level: LogLevel['level']): string {
    if (!this.color) return '';
    switch (level) {
      case 'debug':
        return '\x1b[36m'; // cyan
      case 'info':
        return '\x1b[32m'; // green
      case 'warn':
        return '\x1b[33m'; // yellow
      case 'error':
        return '\x1b[31m'; // red
    }
  }

  /**
   * Output final result in chosen format.
   * In JSON mode, combines all logs and structured result.
   * In human-readable mode, outputs a summary.
   */
  result(data: Record<string, unknown>, duration?: number): void {
    const elapsed = duration ?? Date.now() - this.startTime;

    if (this.format === 'json') {
      const output = {
        success: !this.logs.some((l) => l.level === 'error'),
        duration: elapsed,
        result: data,
        logs: this.verbose ? this.logs : [],
      };
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log('\n' + '='.repeat(60));
      for (const [key, value] of Object.entries(data)) {
        if (value === undefined) continue;
        if (Array.isArray(value) && value.length > 0) {
          console.log(`${key}:`);
          for (const item of value) {
            console.log(`  ${JSON.stringify(item)}`);
          }
        } else if (typeof value === 'object' && value !== null) {
          console.log(`${key}:`, JSON.stringify(value, null, 2));
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log(`\nCompleted in ${this.formatDuration(elapsed)}`);
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  }

  /**
   * Get all collected logs (for testing or further processing).
   */
  getLogs(): LogLevel[] {
    return [...this.logs];
  }
}
