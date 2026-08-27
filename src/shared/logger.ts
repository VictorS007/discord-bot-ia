/**
 * Logger simples, sem dependências extras.
 *
 * Níveis: debug < info < warn < error.
 * Em produção, defina LOG_LEVEL=info (ou warn) no .env.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  constructor(private readonly minLevel: LogLevel) {}

  debug(message: string, extra?: Record<string, unknown>): void {
    this.write('debug', message, extra);
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.write('info', message, extra);
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.write('warn', message, extra);
  }

  error(message: string, extra?: Record<string, unknown>): void {
    this.write('error', message, extra);
  }

  private write(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const payload = extra ? ` ${JSON.stringify(extra)}` : '';
    const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${payload}`;

    if (level === 'error') {
      console.error(line);
      return;
    }

    if (level === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  }
}
