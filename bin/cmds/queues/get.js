const { i18n } = global;

const queues = require('../../../lib/queues');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'get [queueName]';
exports.desc = i18n.t('queues.get.description');
exports.builder = function builder(yargs) {
  return yargs
    .positional('queueName', {
      describe: i18n.t('queues.get.options.queueName'),
      type: 'string',
    })
    .option('a', {
      alias: 'all',
      describe: i18n.t('queues.get.options.all'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { verbose, queueName } = argv;

  if (!queueName && !argv.all) {
    console.error(i18n.t('queues.get.missingChoice'));
    process.exit(1);
  }

  if (verbose) {
    if (argv.all) {
      console.log(`* Fetching queue [${queueName}] from ${config.ezmesure.baseUrl}`);
    } else {
      console.log(`* Fetching queues from ${config.ezmesure.baseUrl}`);
    }
  }

  let result;

  try {
    if (argv.all) {
      ({ data: result } = await queues.getAll());
    } else {
      ({ data: result } = await queues.findById(queueName));
    }
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
};
