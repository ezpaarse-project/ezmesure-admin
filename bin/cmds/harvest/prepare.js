const { i18n } = global;

const chalk = require('chalk');

const harvestLib = require('../../../lib/harvest');
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
  .option('report-types', {
    alias: 'rt',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.reportTypes'),
    group: 'Session parameters :',
    default: [
      'dr',
      'dr_d1',
      'ir',
      'pr',
      'pr_p1',
      'tr',
      'tr_b1',
      'tr_j1',
    ],
  })
  .option('harvest-id', {
    alias: 'hid',
    type: 'string',
    describe: i18n.t('harvest.prepare.options.harvestId'),
    group: 'Session parameters :',
  })
  .option('sushi-ids', {
    alias: 's',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.sushiId'),
    group: 'Session parameters :',
  })
  .option('institution-ids', {
    alias: 'i',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.institutionId'),
    group: 'Session parameters :',
  })
  .option('endpoint-ids', {
    alias: 'e',
    type: 'array',
    describe: i18n.t('harvest.prepare.options.endpointId'),
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
  .option('download-unsupported', {
    describe: i18n.t('harvest.prepare.options.downloadUnsupported'),
    group: 'Session parameters :',
    type: 'boolean',
  })
  .option('timeout', {
    describe: i18n.t('harvest.prepare.options.timeout'),
    group: 'Session parameters :',
    type: 'number',
  })
  .option('format', {
    type: 'string',
    choices: ['json', 'ndjson'],
    describe: i18n.t('harvest.prepare.options.format'),
  });

async function prepareSession(options) {
  if (Array.isArray(options.institutions)) {
    options.institutionIds = options.institutions.map(({ id }) => id);
  }
  if (Array.isArray(options.endpoints)) {
    options.endpointIds = options.endpoints.map(({ id }) => id);
  }
  if (Array.isArray(options.sushis)) {
    options.sushiIds = options.sushis.map(({ id }) => id);
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

  if (!hasFilters) {
    console.error(chalk.red(i18n.t('harvest.prepare.noFilter')));
    return undefined;
  }

  let item;
  try {
    // Preparing body
    const body = {
      beginDate: options.from,
      endDate: options.to,
      reportTypes: options.reportTypes.map((reportType) => reportType.toLowerCase()),
      credentialsQuery: {
        sushiIds: options.sushiIds,
        institutionIds: options.institutionIds,
        endpointIds: options.endpointIds,
      },
      forceDownload: options.forceDownload,
      allowFaulty: options.allowFaulty,
      timeout: options.timeout,
      ignoreValidation: options.ignoreValidation,
      downloadUnsupported: options.downloadUnsupported,
    };

    // Log more info if needed
    if (options.verbose) {
      if (options.harvestId) {
        console.log(chalk.grey(`Upserting harvest session "${options.harvestId}" from ${config.ezmesure.baseUrl} with :`));
      } else {
        console.log(chalk.grey(`Creating new harvest session from ${config.ezmesure.baseUrl} with :`));
      }
      console.group();
      console.log(chalk.grey(`- ${options.sushiIds.length} sushi ids`));
      console.log(chalk.grey(`- ${options.institutionIds.length} institution ids`));
      console.log(chalk.grey(`- ${options.endpointIds.length} endpoint ids`));
      console.groupEnd();
    }

    if (options.harvestId) {
      ({ data: item } = await harvestLib.upsert(options.harvestId, body));
    } else {
      ({ data: item } = await harvestLib.create(body));
    }
  } catch (error) {
    console.error(formatApiError(error));
    return undefined;
  }

  return item;
}

function readAllStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

function mergeParams(params, overrides) {
  const merged = { ...params };
  Object.keys(overrides)
    .filter((key) => overrides[key] != null)
    .forEach((key) => { merged[key] = overrides[key]; });
  return merged;
}

exports.handler = async function handler(argv) {
  const {
    harvestId,
    format: outputFormat,
    $0: scriptName,
  } = argv;

  // Make args override provided options
  const overrides = {
    from: argv.from,
    to: argv.to,
    reportTypes: argv.reportTypes,
    sushiIds: argv.sushiIds,
    institutionIds: argv.institutionIds,
    endpointIds: argv.endpointIds,
    forceDownload: argv.cache != null ? argv.cache === false : undefined,
    allowFaulty: argv.allowFaulty,
    timeout: argv.timeout,
    ignoreValidation: argv.ignoreValidation,
    downloadUnsupported: argv.downloadUnsupported,
    verbose: argv.verbose,
  };

  let sessionParams = [];
  if (harvestId) {
    sessionParams = [{ harvestId }];
  }

  // Parse stdin if needed
  if (!process.stdin.isTTY) {
    try {
      const data = JSON.parse(await readAllStdin());
      sessionParams = Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error(`Couldn't read from stdin: ${error}`);
      process.exit(0);
    }
  }

  const results = [];
  for (const params of sessionParams) {
    const session = await prepareSession(mergeParams(params, overrides));

    if (!session) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (outputFormat === 'json') {
      results.push(session);
      // eslint-disable-next-line no-continue
      continue;
    }

    if (outputFormat === 'ndjson') {
      console.log(JSON.stringify(session));
      // eslint-disable-next-line no-continue
      continue;
    }

    console.log(chalk.green(i18n.t('harvest.prepare.success', { id: session.id })));
    console.log(chalk.blue(i18n.t('harvest.prepare.runStatusCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status ${session.id}`));
    console.log(chalk.blue(i18n.t('harvest.prepare.runCredentialsCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status ${session.id} --credentials`));
    console.log(chalk.blue(i18n.t('harvest.prepare.runStartCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest start ${session.id}`));
  }

  if (outputFormat === 'json') {
    console.log(JSON.stringify(results, null, 2));
  }
};
