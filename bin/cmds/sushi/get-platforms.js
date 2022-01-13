const { i18n } = global;

const chalk = require('chalk');
const { table } = require('table');

const sushiLib = require('../../../lib/sushi');
const { config } = require('../../../lib/app/config');

exports.command = 'get-platforms';
exports.desc = i18n.t('sushi.getPlatforms.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('f', {
      alias: 'fields',
      describe: i18n.t('sushi.getPlatforms.options.fields'),
      type: 'string',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('sushi.getPlatforms.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('sushi.getPlatforms.options.ndjson'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  const availableFields = [
    'vendor',
    'sushiUrl',
    'customerId',
    'requestorId',
    'apiKey',
    'description',
    'companies',
  ];

  let fields = availableFields.slice();

  if (argv.fields) {
    fields = argv.fields.split(',').map((field) => field.trim());

    const unknownFields = fields.filter((field) => !availableFields.includes(field));

    if (unknownFields.length > 0) {
      console.error(i18n.t('sushi.getPlatforms.unknownFields', { fields: unknownFields.join(',') }));
      process.exit(1);
    }
  }

  if (verbose) {
    console.log(`* Retrieving SUSHI platforms from ${config.ezmesure.baseUrl}`);
  }

  let sushiPlatforms;
  try {
    const { data } = await sushiLib.getPlatforms();
    if (data) { sushiPlatforms = data; }
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
  }

  if (!Array.isArray(sushiPlatforms)) {
    console.log(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  if (argv.ndjson) {
    sushiPlatforms.forEach((item) => console.log(JSON.stringify(item)));
    process.exit(0);
  }

  if (argv.json) {
    console.log(JSON.stringify(sushiPlatforms));
    process.exit(0);
  }

  const header = fields.map((field) => i18n.t(`sushi.getPlatforms.fields.${field}`));

  const lines = sushiPlatforms
    .filter((platform) => !platform.isNonSushi)
    .sort((a, b) => (a?.vendor?.toLowerCase() < b?.vendor?.toLowerCase() ? 1 : -1))
    .map((platform) => fields.map((field) => {
      const value = platform[field];
      if (typeof value === 'boolean') {
        return value ? chalk.green(i18n.t('global.yes')) : chalk.red(i18n.t('global.no'));
      }
      return value || '';
    }));

  console.log(table([header, ...lines]));
};
