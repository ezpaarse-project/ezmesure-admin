const { i18n } = global;

const scopes = require('../../../lib/app/config').getScopes();

exports.command = 'view';
exports.desc = i18n.t('config.view.description');
exports.builder = {};
exports.handler = async function handler() {
  const { global, local } = scopes;

  console.log(`[${i18n.t('config.view.global')}]`);
  console.log(JSON.stringify(global.config || {}, null, 2));

  console.log(`\n[${i18n.t('config.view.local')}]`);
  console.log(JSON.stringify(local.config || {}, null, 2));
};
