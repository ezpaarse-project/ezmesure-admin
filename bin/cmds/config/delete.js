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
  const { key, global, verbose } = argv;

  const scope = scopes[global ? 'global' : 'local'];

  if (verbose) {
    console.log(`* Remove config key [${key}] from ${global ? 'global' : 'local'} config`);
  }

  if (!scope) { return; }

  const config = scope.config || {};
  unset(config, key);

  await fs.ensureFile(scope.location);
  await fs.writeFile(scope.location, JSON.stringify(config, null, 2));

  console.log(`Config key [${key}] has been removed successfully`);
};
