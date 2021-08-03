const { i18n } = global;

const scopes = require('../../../lib/app/config').getScopes();

exports.command = 'view';
exports.desc = i18n.t('config.view.description');
exports.builder = function builder(yargs) {
  return yargs.option('global', {
    alias: 'g',
    describe: i18n.t('config.view.options.global'),
    boolean: true,
  });
};
exports.handler = async function handler(argv) {
  const { global: seeGlobal } = argv;

  const { global, local } = scopes;

  console.log(i18n.t('config.view.priority'));

  console.log(`\n[${i18n.t('config.view.local')}]`);
  console.log(JSON.stringify(local.config || {}, null, 2));

  if (seeGlobal) {
    console.log(`[${i18n.t('config.view.global')}]`);
    console.log(JSON.stringify(global.config || {}, null, 2));
    process.exit(0);
  }
};
