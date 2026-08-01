/** Structured JSON logging (Vercel captures stdout). */

function write(level, message, meta) {
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
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

export default logger;
