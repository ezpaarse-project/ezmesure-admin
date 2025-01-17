const chalk = require('chalk');
const { MultiBar, Presets } = require('cli-progress');

const logAlongProgress = (message, color = undefined) => {
  const msg = color ? chalk.stderr[color](message) : message;
  process.stderr.write(`${msg}\n`);
};

const initProgress = (opts) => {
  if (!process.stderr.isTTY) {
    return {
      bar: null,
      stop: () => {},
      log: logAlongProgress,
    };
  }

  const multiBar = new MultiBar(
    {
      format: chalk.stderr.grey('    {bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}'),
      hideCursor: true,
      forceRedraw: true,
      ...(opts?.bar ?? {}),
      stream: process.stderr,
    },
    Presets.shades_classic,
  );
  const bar = multiBar.create(opts?.total ?? 0, opts?.startValue ?? 0);
  return {
    bar,
    stop: () => multiBar.stop(),
    log: (message, color) => {
      const msg = color ? chalk.stderr[color](message) : message;
      multiBar.log(`${msg}\n`);
    },
  };
};

module.exports = { initProgress, logAlongProgress };
