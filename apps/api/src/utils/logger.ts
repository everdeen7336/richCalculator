type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (LOG_LEVELS.debug >= LOG_LEVELS[currentLevel]) {
      console.debug(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: unknown) {
    if (LOG_LEVELS.info >= LOG_LEVELS[currentLevel]) {
      console.info(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: unknown) {
    if (LOG_LEVELS.warn >= LOG_LEVELS[currentLevel]) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: unknown) {
    if (LOG_LEVELS.error >= LOG_LEVELS[currentLevel]) {
      console.error(formatMessage('error', message, meta));
    }
  },
};

export class Logger {
  constructor(private context: string) {}

  debug(message: string, meta?: unknown) {
    logger.debug(`[${this.context}] ${message}`, meta);
  }

  info(message: string, meta?: unknown) {
    logger.info(`[${this.context}] ${message}`, meta);
  }

  warn(message: string, meta?: unknown) {
    logger.warn(`[${this.context}] ${message}`, meta);
  }

  error(message: string, meta?: unknown) {
    logger.error(`[${this.context}] ${message}`, meta);
  }
}
