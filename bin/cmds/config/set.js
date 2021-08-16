const { i18n } = global;

const fs = require('fs-extra');
const set = require('lodash.set');
const scopes = require('../../../lib/app/config').getScopes();

exports.command = 'set <key> <value>';
exports.desc = i18n.t('config.set.description');
exports.builder = function builder(yargs) {
  return yargs.positional('key', {
    describe: i18n.t('config.set.options.key'),
    type: 'string',
  }).positional('value', {
    describe: i18n.t('config.set.options.value'),
    type: 'string',
  }).option('global', {
    alias: 'g',
    describe: i18n.t('config.set.options.global'),
    boolean: true,
  });
};
exports.handler = async function handler(argv) {
  const { global, key, verbose } = argv;

  const scope = scopes[global ? 'global' : 'local'];
  const config = scope.config || {};

  let { value } = argv;

  if (/^true$/i.test(value)) {
    value = true;
  } else if (/^false$/i.test(value)) {
    value = false;
  } else if (/^[0-9]+$/.test(value)) {
    value = Number.parseInt(value, 10);
  }

  if (verbose) {
    console.log(`* Set value [${value}] to key [${key}] in ${global ? 'global' : 'local'} configuration`);
  }

  set(config, key, value);

  try {
    await fs.ensureFile(scope.location);
    await fs.writeFile(scope.location, JSON.stringify(config, null, 2));
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
