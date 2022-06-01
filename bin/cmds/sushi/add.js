const { i18n } = global;

const sushiLib = require('../../../lib/sushi');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'add';
exports.desc = i18n.t('sushi.add.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('n', {
      alias: 'vendor',
      type: 'string',
      describe: i18n.t('sushi.add.options.vendor'),
    })
    .option('r', {
      alias: 'requestorId',
      type: 'string',
      describe: i18n.t('sushi.add.options.requestorId'),
    })
    .option('c', {
      alias: 'customerId',
      type: 'string',
      describe: i18n.t('sushi.add.options.customerId'),
    })
    .option('k', {
      alias: 'apiKey',
      type: 'string',
      describe: i18n.t('sushi.add.options.apiKey'),
    })
    .option('m', {
      alias: 'comment',
      type: 'string',
      describe: i18n.t('sushi.add.options.comment'),
    })
    .option('p', {
      alias: 'package',
      type: 'string',
      describe: i18n.t('sushi.add.options.package'),
    })
    .option('i', {
      alias: 'institutionId',
      type: 'string',
      describe: i18n.t('sushi.add.options.institutionId'),
    })
    .option('e', {
      alias: 'endpointId',
      type: 'string',
      describe: i18n.t('sushi.add.options.endpointId'),
    })
    .option('params', {
      type: 'array',
      describe: i18n.t('sushi.add.options.params'),
      coerce: (array) => array.flatMap((v) => v.split(',')),
    });
};
exports.handler = async function handler(argv) {
  const {
    vendor,
    requestorId,
    customerId,
    apiKey,
    comment,
    package: sushiPackage,
    institutionId,
    endpointId,

    verbose,
  } = argv;

  let params;

  if (Array.isArray(argv.params)) {
    params = argv.params.map((str) => {
      const match = /^([^=]*)=?(.*)/.exec(str);
      return { name: match?.[1], value: match?.[2] };
    });
  }

  const sushi = {
    vendor,
    requestorId,
    customerId,
    apiKey,
    comment,
    package: sushiPackage,
    institutionId,
    endpointId,
    params,
  };

  if (verbose) {
    console.log(`* Creating SUSHI credentials from ${config.ezmesure.baseUrl}`);
  }

  try {
    await sushiLib.add(sushi);
  } catch (err) {
    console.error(formatApiError(err));
    process.exit(1);
  }

  console.log(i18n.t('sushi.add.created'));
};
