const { i18n } = global;

const indicesLib = require('../../../lib/indices');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'add <index>';
exports.desc = i18n.t('indices.add.description');
exports.builder = function builder(yargs) {
  return yargs.positional('index', {
    describe: i18n.t('indices.add.options.index'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const { index, verbose } = argv;

  if (verbose) {
    console.log(`* Create index [${index}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    await indicesLib.create(index);
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  console.log(i18n.t('indices.add.created', { index }));
};
