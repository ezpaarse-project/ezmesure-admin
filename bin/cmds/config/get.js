const { i18n } = global;

const config = require('../../../lib/app/config');

exports.command = 'get <key>';
exports.desc = i18n.t('config.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('key', {
    describe: i18n.t('config.get.options.key'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const { key, verbose } = argv;

  if (verbose) {
    console.log(`* Display value for config key [${key}]`);
  }

  console.log(config.get(key, ''));
};
