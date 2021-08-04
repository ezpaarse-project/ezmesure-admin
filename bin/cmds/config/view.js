const { i18n } = global;

const merge = require('lodash.merge');

const scopes = require('../../../lib/app/config').getScopes();

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
  const { global: seeGlobal, local: seeLocal } = argv;

  const { global, local } = scopes;

  if (!seeLocal && !seeGlobal) {
    console.log('[Configuration]');
    console.log(JSON.stringify(merge(global?.config, local?.config), null, 2));
    console.log(`[Local] : ${local?.location}`);
    console.log(`[Global] : ${global?.location}`);
    process.exit(0);
  }

  if (seeLocal) {
    console.log(`\n[${i18n.t('config.view.local')}] (${local?.location})`);
    console.log(JSON.stringify(local?.config || {}, null, 2));
  }

  if (seeGlobal) {
    console.log(`\n[${i18n.t('config.view.global')}] (${global?.location})`);
    console.log(JSON.stringify(global?.config || {}, null, 2));
  }
};
