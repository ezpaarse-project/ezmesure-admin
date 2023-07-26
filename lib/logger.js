const {
  createLogger,
  transports,
  format,
} = require('winston');

const {
  combine,
  timestamp,
  printf,
  colorize,
} = format;

// logger configuration
const processConfiguration = [
  new (transports.Console)(),
];

/**
 * Message logger format.
 *
 * @returns {import('winston').Logger.format} Logger format.
 */
function devFormat() {
  const formatMessage = (info) => `${info.level}: ${info.message}`;
  const formatError = (info) => `${info.level}: ${info.message}\n\n${info.stack}\n`;
  const form = (info) => (info instanceof Error ? formatError(info) : formatMessage(info));
  return combine(colorize(), timestamp(), printf(form));
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  exitOnError: false,
  transports: processConfiguration,
  format: devFormat(),
});

module.exports = logger;
