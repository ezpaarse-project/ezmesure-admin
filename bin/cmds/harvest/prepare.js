const { i18n } = global;

const chalk = require('chalk');

const harvestLib = require('../../../lib/harvest');
const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'prepare';
exports.desc = i18n.t('harvest.prepare.description');
exports.builder = (yargs) => yargs
  .option('from', {
    type: 'string',
    describe: i18n.t('harvest.prepare.options.from'),
    group: 'Session parameters :',
  })
  .option('to', {
    type: 'string',
    describe: i18n.t('harvest.prepare.options.to'),
    group: 'Session parameters :',
  })
  .option('reportTypes', {
    alias: 'rt',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.reportTypes'),
    group: 'Session parameters :',
  })
  .option('harvestId', {
    alias: 'hid',
    type: 'string',
    describe: i18n.t('harvest.prepare.options.harvestId'),
    group: 'Session parameters :',
  })
  .option('sushiIds', {
    alias: 's',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.sushiId'),
    group: 'Session parameters :',
  })
  .option('institutionIds', {
    alias: 'i',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.institutionId'),
    group: 'Session parameters :',
  })
  .option('endpointIds', {
    alias: 'e',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.endpointId'),
    group: 'Session parameters :',
  })
  .option('all', {
    alias: 'a',
    type: 'boolean',
    describe: i18n.t('harvest.prepare.options.all'),
    group: 'Session parameters :',
  })
  .option('allow-faulty', {
    type: 'boolean',
    describe: i18n.t('harvest.prepare.options.allowFaulty'),
    group: 'Session parameters :',
  })
  .option('ignore-validation', {
    type: 'boolean',
    describe: i18n.t('harvest.prepare.options.ignoreValidation'),
    group: 'Session parameters :',
  })
  .option('no-cache', {
    describe: i18n.t('harvest.prepare.options.noCache'),
    group: 'Session parameters :',
    type: 'boolean',
  })
  .option('timeout', {
    describe: i18n.t('harvest.prepare.options.timeout'),
    group: 'Session parameters :',
    type: 'number',
  })
  .option('j', {
    alias: 'json',
    describe: i18n.t('harvest.prepare.options.json'),
    type: 'boolean',
  });

exports.handler = async function handler(argv) {
  const {
    all,
    verbose,
    harvestId,
    $0: scriptName,
  } = argv;

  const options = {
    from: argv.from,
    to: argv.to,
    reportTypes: argv.reportTypes,
    sushiIds: argv.sushiIds,
    institutionIds: argv.institutionIds,
    endpointIds: argv.endpointIds,
    forceDownload: argv.cache === false,
    allowFaulty: argv.allowFaulty,
    timeout: argv.timeout,
    ignoreValidation: argv.ignoreValidation,
  };

  // Fetching all sushi ids at the time
  if (all) {
    options.sushiIds = [];
    options.endpointIds = [];

    if (verbose) {
      console.log(
        chalk.gray(`Fetching institutions from ${config.ezmesure.baseUrl}`),
      );
    }

    try {
      const { data } = await institutionsLib.getAll();
      options.institutionIds = data.map(({ id }) => id);
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }
  }

  if (!Array.isArray(options.institutionIds)) { options.institutionIds = []; }
  if (!Array.isArray(options.endpointIds)) { options.endpointIds = []; }
  if (!Array.isArray(options.sushiIds)) { options.sushiIds = []; }

  // Checking we're not doing an empty harvest
  const hasFilters = (
    options.institutionIds.length
    + options.endpointIds.length
    + options.sushiIds.length
  ) > 0;

  if (!hasFilters && !all) {
    console.error(chalk.red(i18n.t('harvest.prepare.noFilter')));
    console.error(chalk.blue(i18n.t('harvest.prepare.pleaseSetAllFlag')));
    process.exit(1);
  }

  let item;
  try {
    // Preparing body
    const body = {
      beginDate: options.from,
      endDate: options.to,
      reportTypes: options.reportTypes,
      credentialsQuery: {
        sushiIds: options.sushiIds,
        institutionIds: options.institutionIds,
        endpointIds: options.endpointIds,
      },
      allowFaulty: options.allowFaulty,
      timeout: options.timeout,
      ignoreValidation: options.ignoreValidation,
    };

    // Log more info if needed
    if (verbose) {
      if (harvestId) {
        console.log(
          chalk.grey(`Upserting harvest session "${harvestId}" from ${config.ezmesure.baseUrl} with :`),
        );
      } else {
        console.log(
          chalk.grey(`Creating new harvest session from ${config.ezmesure.baseUrl} with :`),
        );
      }
      console.group();
      console.log(chalk.grey(`- ${options.sushiIds.length} sushi ids`));
      console.log(chalk.grey(`- ${options.institutionIds.length} institution ids`));
      console.log(chalk.grey(`- ${options.endpointIds.length} endpoint ids`));
      console.groupEnd();
    }

    if (harvestId) {
      ({ data: item } = await harvestLib.upsert(harvestId, body));
    } else {
      ({ data: item } = await harvestLib.create(body));
    }
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (argv.json) {
    console.log(JSON.stringify(item, null, 2));
    process.exit(0);
  }

  console.log(chalk.green(i18n.t('harvest.prepare.success', { id: item.id })));
  console.log(chalk.blue(i18n.t('harvest.prepare.runStatusCommand')));
  console.log(chalk.blue(`\t${scriptName} harvest status ${item.id}`));
  console.log(chalk.blue(i18n.t('harvest.prepare.runCredentialsCommand')));
  console.log(chalk.blue(`\t${scriptName} harvest status ${harvestId} --credentials`));
  console.log(chalk.blue(i18n.t('harvest.prepare.runStartCommand')));
  console.log(chalk.blue(`\t${scriptName} harvest start ${item.id}`));
};
