const winston = require('winston');

winston.addColors({
  verbose: 'green',
  info: 'green',
  warn: 'yellow',
  error: 'red',
});

const { format } = winston;

module.exports = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf((info) => {
      if (typeof info.message === 'object') {
        // eslint-disable-next-line no-param-reassign
        info.message = JSON.stringify(info.message);
      }
      return `${info.timestamp} ${info.level}: ${info.message}`;
    }),
  ),
  exitOnError: true,
  transports: [
    new (winston.transports.Console)(),
    new winston.transports.File({ filename: 'log/combined.log' }),
    new winston.transports.File({ filename: 'log/error.log', level: 'error' }),
  ],
});
