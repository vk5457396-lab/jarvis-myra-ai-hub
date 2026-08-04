/** Structured JSON logging (Vercel captures stdout). */

function write(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const line = {
    level,
    time: new Date().toISOString(),
    service: 'myra-api',
    message,
    ...(meta || {}),
  };
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(line));
}

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};

export default logger;
