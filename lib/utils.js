const chalk = require('chalk');

exports.formatApiError = (e, opts = {}) => {
  const errorMessage = e?.response?.data?.error;
  const status = e?.response?.status;
  const statusText = e?.response?.statusText;
  let prefix = '';

  if (opts.prefix !== false) {
    prefix = opts.colorize === false ? 'Error: ' : chalk.red('Error: ');
  }

  if (errorMessage) {
    return `${prefix}${errorMessage}`;
  }
  if (status && statusText) {
    return `${prefix}${status} ${statusText}`;
  }

  return `${prefix}${e.stack}`;
};
