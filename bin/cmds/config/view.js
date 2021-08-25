const { i18n } = global;
const { config, getScopes } = require('../../../lib/app/config');

exports.command = 'view';
exports.desc = i18n.t('config.view.description');
exports.builder = function builder(yargs) {
  return yargs.option('g', {
    alias: 'global',
    describe: i18n.t('config.view.options.global'),
    type: 'boolean',
  }).option('l', {
    alias: 'local',
    describe: i18n.t('config.view.options.local'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const { global: seeGlobal, local: seeLocal, verbose } = argv;

  const { global, local } = getScopes();

  if (!seeLocal && !seeGlobal) {
    if (verbose) {
      console.log('* [Configuration]');
    }
    console.log(JSON.stringify(config, null, 2));
    if (verbose) {
      console.log(`* [Local] : ${local?.location}`);
      console.log(`* [Global] : ${global?.location}`);
    }
    process.exit(0);
  }

  if (seeLocal) {
    if (verbose) {
      console.log(`\n* [${i18n.t('config.view.local')}] (${local?.location})`);
    }
    console.log(JSON.stringify(local?.config || {}, null, 2));
  }

  if (seeGlobal) {
    if (verbose) {
      console.log(`\n* [${i18n.t('config.view.global')}] (${global?.location})`);
    }
    console.log(JSON.stringify(global?.config || {}, null, 2));
  }
};
