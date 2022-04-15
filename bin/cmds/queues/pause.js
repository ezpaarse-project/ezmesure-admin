const { i18n } = global;

const chalk = require('chalk');

const queues = require('../../../lib/queues');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'pause <queueName>';
exports.desc = i18n.t('queues.pause.description');
exports.builder = function builder(yargs) {
  return yargs
    .positional('queueName', {
      describe: i18n.t('queues.pause.options.queueName'),
      type: 'string',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('queues.pause.options.json'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { verbose, queueName } = argv;

  if (verbose) {
    console.log(`* Pausing queue [${queueName}] from ${config.ezmesure.baseUrl}`);
  }

  let result;

  try {
    ({ data: result } = await queues.pause(queueName));
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (typeof result?.paused !== 'boolean') {
    console.error(JSON.stringify(result, null, 2));
    console.error(i18n.t('queues.pause.invalidResponse'));
    process.exit(1);
  }

  if (argv.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  if (result?.paused) {
    console.log(i18n.t('queues.pause.paused', { name: queueName }));
    process.exit(0);
  } else {
    console.error(chalk.red(i18n.t('queues.pause.notPaused', { name: queueName })));
    process.exit(1);
  }
};
