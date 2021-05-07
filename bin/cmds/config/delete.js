const { i18n } = global;

const fs = require('fs-extra');
const unset = require('lodash.unset');
const scopes = require('../../../lib/app/config').getScopes();

exports.command = 'delete <key>';
exports.desc = i18n.t('config.delete.description');
exports.builder = function builder(yargs) {
  return yargs.positional('key', {
    describe: i18n.t('config.delete.options.key'),
    type: 'string',
  }).option('global', {
    alias: 'g',
    describe: i18n.t('config.delete.options.global'),
    boolean: true,
  });
};
exports.handler = async function handler(argv) {
  const scope = scopes[argv.global ? 'global' : 'local'];

  if (!scope) { return; }

  const config = scope.config || {};
  unset(config, argv.key);

  await fs.ensureFile(scope.location);
  await fs.writeFile(scope.location, JSON.stringify(config, null, 2));
};
