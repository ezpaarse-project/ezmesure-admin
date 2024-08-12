/* eslint-disable no-continue */
const { i18n } = global;

const { setTimeout } = require('node:timers/promises');

const chalk = require('chalk');
const { MultiBar, Presets } = require('cli-progress');
const { format, subMonths } = require('date-fns');
const { table } = require('table');
const { default: slugify } = require('slugify');

const sushiLib = require('../../../lib/sushi');
const sushiEndpointsLib = require('../../../lib/sushiEndpoints');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

const BLOCKING_SUSHI_CODES = new Set([
  3000, // unsupportedReport
  3010, // unsupportedReportVersion
  3020, // invalidDates
  3030, // unavailablePeriod
  3031, // usageNotReadyForRequestedDates
  3032, // usageNotAvailable
]);

exports.command = 'harvestable';
exports.desc = i18n.t('endpoints.harvestable.description');
exports.builder = (yargs) => yargs
  .option('from', {
    type: 'string',
    describe: i18n.t('harvest.prepare.options.from'),
  })
  .option('to', {
    type: 'string',
    describe: i18n.t('harvest.prepare.options.to'),
  })
  .option('allow-inactive', {
    type: 'boolean',
    describe: i18n.t('endpoints.harvestable.options.allowInactive'),
    default: false,
  })
  .option('allow-faulty', {
    type: 'boolean',
    describe: i18n.t('endpoints.harvestable.options.allowFaulty'),
    default: false,
  })
  .option('allow-error', {
    type: 'boolean',
    describe: i18n.t('endpoints.harvestable.options.allowError'),
    default: false,
  })
  .option('format', {
    type: 'string',
    choices: ['json', 'ndjson', 'harvest-options'],
    describe: i18n.t('institutions.harvestable.options.format'),
  });

function log(message, color) {
  const msg = color ? chalk.stderr[color](message) : message;
  process.stderr.write(`${msg}\n`);
}

function initProgress(opts) {
  if (!process.stderr.isTTY) {
    return {
      bar: null,
      stop: () => {},
      log,
    };
  }

  const multiBar = new MultiBar(
    {
      format: chalk.stderr.grey('    {bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}'),
      hideCursor: true,
      forceRedraw: true,
      ...(opts?.bar ?? {}),
      stream: process.stderr,
    },
    Presets.shades_classic,
  );
  const bar = multiBar.create(opts?.total ?? 0, opts?.startValue ?? 0);
  return {
    bar,
    stop: () => multiBar.stop(),
    log: (message, color) => {
      const msg = color ? chalk.stderr[color](message) : message;
      multiBar.log(`${msg}\n`);
    },
  };
}

exports.handler = async function handler(argv) {
  const {
    from,
    to,
    allowInactive,
    allowFaulty,
    allowError,
    format: outputFormat,
    verbose,
  } = argv;

  // Setup allowed connection statuses
  const allowedConnectionStatuses = new Set(['success']);
  if (allowError) { allowedConnectionStatuses.add('failed'); }
  if (allowFaulty) {
    allowedConnectionStatuses.add('unauthorized');
    allowedConnectionStatuses.add(undefined);
  }

  if (verbose) {
    log(`Fetching endpoints from ${config.ezmesure.baseUrl}\n`, 'grey');
  }

  // Get all endpoints with their credentials and their institution
  const endpointsByStatus = { ready: [], notReady: [], unknown: [] };
  let endpoints;
  try {
    endpoints = (await sushiEndpointsLib.getAll({
      include: ['credentials.institution'],
      sort: 'vendor',
      active: !allowInactive,
    })).data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  const progress = initProgress({ total: endpoints.length });

  // Prepare utils functions
  const accept = (endpoint, reason) => {
    progress.log(reason, 'green');
    progress.bar?.increment();
    endpointsByStatus.ready.push(endpoint);
  };

  const skip = (endpoint, reason, asUnknown = false) => {
    progress.log(reason, asUnknown ? 'yellow' : 'red');
    progress.bar?.increment();
    if (asUnknown) {
      endpointsByStatus.unknown.push(endpoint);
      return;
    }
    endpointsByStatus.notReady.push(endpoint);
  };

  // Prepare dates
  const threeMonthAgo = format(subMonths(new Date(), 3), 'yyyy-MM');
  const period = { start: from || to || threeMonthAgo, end: to || from || threeMonthAgo };
  progress.log(
    i18n.t('endpoints.harvestable.testingPeriod', { from: chalk.stderr.bold(period.start), to: chalk.stderr.bold(period.end) }),
    'blue',
  );

  // Check all endpoints one by one
  for (const e of endpoints) {
    const { credentials, ...endpoint } = e;
    if (verbose) {
      progress.log(`Checking ${chalk.stderr.bold(endpoint.vendor)}...`, 'grey');
    }

    if (credentials.length <= 0) {
      skip(e, i18n.t('endpoints.harvestable.endpointNoCredentials', { endpoint: chalk.stderr.bold(endpoint.vendor) }), true);
      continue;
    }

    const usableCredentials = credentials.filter(
      (credential) => allowedConnectionStatuses.has(credential.connection?.status),
    );
    if (usableCredentials.length <= 0) {
      skip(e, i18n.t('endpoints.harvestable.endpointNoUsableCredentials', { endpoint: chalk.stderr.bold(endpoint.vendor) }), true);
      continue;
    }

    // Check all credentials, but only one at a time, breaks on the first success
    let tries = 0;
    let endpointConnection;
    let endpointException;
    for (const creds of usableCredentials) {
      // Avoid spamming the API and endpoints
      // (not the first time to avoid slowing down the whole process)
      if (tries > 0) {
        await setTimeout(1000);
      }

      tries += 1;
      let credsName = chalk.stderr.bold(creds.institution.name);
      if (creds.packages?.length > 0) {
        credsName += ` (${creds.packages.map((p) => chalk.stderr.italic(p)).join(', ')})`;
      }

      if (verbose) {
        progress.log(`\tTesting with ${credsName} credentials...`, 'grey');
      }

      let connection;
      try {
        connection = (await sushiLib.test(
          {
            ...creds,
            id: undefined, // Doesn't update credentials status to avoid user confusion
            institution: undefined, // Force report's file path to start with /tmp
            endpoint,
          },
          { beginDate: from, endDate: to },
        )).data;

        if (verbose) {
          progress.log(`\tGot: ${chalk.stderr.bold(connection?.status)} ${chalk.stderr.italic(connection?.errorCode ?? '')}`, 'grey');
        }
      } catch (error) {
        progress.log(`\t${i18n.t('endpoints.harvestable.endpointTestError', {
          credsName,
          endpoint: chalk.stderr.bold(endpoint.vendor),
          error: formatApiError(error),
        })}}`, 'orange');
      }

      if (!connection) {
        continue;
      }

      if (!allowedConnectionStatuses.has(connection.status)) {
        continue;
      }

      // Checking for blocking errors
      const blockingException = (connection.exceptions ?? []).find(
        (exception) => BLOCKING_SUSHI_CODES.has(exception.Code),
      );
      if (blockingException) {
        if (verbose) {
          progress.log(`\t${chalk.stderr.bold(endpoint.vendor)} returned ${chalk.stderr.bold(blockingException.Code)}: [${chalk.stderr.italic(blockingException.Severity)}] ${chalk.stderr.italic(blockingException.Message)}`, 'grey');
        }
        endpointException = blockingException;
        continue;
      }

      endpointConnection = connection;
      endpointException = undefined;
      break;
    }

    if (endpointException) {
      skip(e, i18n.t('endpoints.harvestable.endpointAllExceptions', {
        endpoint: chalk.stderr.bold(endpoint.vendor),
        tries: chalk.stderr.italic(tries),
        exception: chalk.stderr.italic(i18n.t('endpoints.harvestable.endpointExceptionMessage', endpointException)),
      }));
      continue;
    }

    if (!endpointConnection) {
      skip(e, i18n.t('endpoints.harvestable.endpointNoResponse', {
        endpoint: chalk.stderr.bold(endpoint.vendor),
        tries: chalk.stderr.italic(tries),
        total: chalk.stderr.italic(usableCredentials.length),
      }));
      continue;
    }

    accept(e, i18n.t('endpoints.harvestable.endpointReady', {
      endpoint: chalk.stderr.bold(endpoint.vendor),
      tries: chalk.stderr.italic(tries),
      total: chalk.stderr.italic(usableCredentials.length),
    }));
  }

  progress.stop();

  if (outputFormat === 'harvest-options') {
    const now = new Date();
    const harvestSessions = [...endpointsByStatus.ready, ...endpointsByStatus.unknown].map((e) => ({
      harvestId: `${format(now, 'yyyy-MM-dd')}_${slugify(e.vendor.toLowerCase())}_${format(now, 'yyyy')}`,
      from: period.start,
      to: period.end,
      endpoints: [{
        id: e.id,
        name: e.vendor,
      }],
    }));
    process.stdout.write(`${JSON.stringify(harvestSessions, null, 2)}\n`);
    return;
  }

  if (outputFormat === 'json') {
    process.stdout.write(`${JSON.stringify(endpointsByStatus, null, 2)}\n`);
    return;
  }

  if (outputFormat === 'ndjson') {
    const endpointList = Object.entries(endpointsByStatus).map(
      ([status, endpointOfStatus]) => endpointOfStatus.map(
        (endpoint) => ({ endpoint, status }),
      ),
    ).flat();
    endpointList.forEach((r) => process.stdout.write(`${JSON.stringify(r)}\n`));
    return;
  }

  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatCell = (type) => {
    const value = endpointsByStatus[type].length;
    const percentage = (value / (endpoints.length || 1));
    if (percentage > 0.1) {
      return `${value} (${numberFormat.format(percentage * 100)}%)`;
    }
    return `${value}`;
  };

  process.stdout.write(
    table([
      [
        chalk.bold(i18n.t('endpoints.harvestable.status.ready')),
        chalk.bold(i18n.t('endpoints.harvestable.status.notReady')),
        chalk.bold(i18n.t('endpoints.harvestable.status.unknown')),
        chalk.bold(i18n.t('endpoints.harvestable.status.total')),
      ],
      [
        chalk.green(`✓ ${formatCell('ready')}`),
        chalk.red(`x ${formatCell('notReady')}`),
        chalk.yellow(`? ${formatCell('unknown')}`),
        endpoints.length,
      ],
    ]),
  );
  process.stdout.write('\n');
};
