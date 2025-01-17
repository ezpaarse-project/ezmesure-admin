/* eslint-disable no-continue */
const { i18n } = global;

const { setTimeout } = require('node:timers/promises');

const chalk = require('chalk');
const { format, subMonths } = require('date-fns');
const { table } = require('table');

const { initProgress, logAlongProgress } = require('../../../lib/progress');
const { config } = require('../../../lib/app/config');
const sushiLib = require('../../../lib/sushi');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'test-all';
exports.desc = i18n.t('sushi.testAll.description');
exports.builder = (yargs) => yargs
  .option('from', {
    type: 'string',
    describe: i18n.t('harvest.prepare.options.from'),
  })
  .option('to', {
    type: 'string',
    describe: i18n.t('harvest.prepare.options.to'),
  })
  .option('dry-run', {
    describe: i18n.t('sushi.testAll.options.dryRun'),
    type: 'array',
  })
  .option('include-inactive', {
    type: 'boolean',
    describe: i18n.t('sushi.testAll.options.includeInactive'),
    default: false,
  })
  .option('format', {
    type: 'string',
    choices: ['jsonl'],
    describe: i18n.t('sushi.testAll.options.format'),
  });

exports.handler = async function handler(argv) {
  const {
    from,
    to,
    dryRun,
    includeInactive,
    format: outputFormat,
    verbose,
  } = argv;

  if (verbose) {
    logAlongProgress(`Fetching credentials from ${config.ezmesure.baseUrl}\n`, 'grey');
  }

  let credentials;
  try {
    credentials = (await sushiLib.getAll({
      include: ['institution', 'endpoint'],
      sort: 'institution.name',
      active: !includeInactive ? true : undefined,
    })).data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  const credentialsCount = credentials.length;
  const progress = initProgress({ total: credentialsCount });

  if (dryRun) {
    progress.log('Testing without updating credentials status', 'blue');
  }

  // Prepare dates
  const threeMonthAgo = format(subMonths(new Date(), 3), 'yyyy-MM');
  const period = { start: from || to || threeMonthAgo, end: to || from || threeMonthAgo };
  progress.log(
    i18n.t('endpoints.harvestable.testingPeriod', { from: chalk.stderr.bold(period.start), to: chalk.stderr.bold(period.end) }),
    'blue',
  );

  const credentialsStatuses = {};

  // Prepare utils functions
  const outputResult = (creds, connection, reason, increment = true) => {
    let color = 'red';
    switch (connection?.status) {
      case 'success':
        color = 'green';
        break;
      case 'unauthorized':
        color = 'yellow';
        break;

      default:
        break;
    }

    const count = credentialsStatuses[connection?.status || 'failed'];
    credentialsStatuses[connection?.status || 'failed'] = (count ?? 0) + 1;

    progress.log(reason, color);
    if (increment) {
      progress.bar?.increment();
    }
    if (outputFormat === 'jsonl') {
      process.stdout.write(`${JSON.stringify({ ...creds, newConnection: connection })}\n`);
    }
  };

  for (const creds of credentials) {
    // Prepare friendly name
    let credsName = chalk.stderr.bold(creds.institution.name);
    if (creds.packages?.length > 0) {
      credsName += ` (${creds.packages.map((p) => chalk.stderr.italic(p)).join(', ')})`;
    }
    credsName += ` - ${chalk.stderr.bold(creds.endpoint.vendor)}`;

    if (verbose) {
      progress.log(`Testing with ${credsName} credentials...`, 'grey');
    }

    let connection;
    // Keep track of tries per credential
    creds.connectionTries = (creds.connectionTries || 0) + 1;
    try {
      connection = (await sushiLib.test(
        {
          ...creds,
          id: !dryRun ? creds.id : undefined,
          institution: !dryRun ? creds.institution : undefined,
          endpoint: creds.endpoint,
          connectionTries: undefined,
        },
        { beginDate: from, endDate: to },
      )).data;

      if (verbose) {
        progress.log(`Got: ${chalk.stderr.bold(connection?.status)} ${chalk.stderr.italic(connection?.errorCode ?? '')}`, 'grey');
      }
    } catch (error) {
      progress.log(i18n.t('endpoints.testAll.error', {
        credsName,
        error: formatApiError(error),
      }), 'yellow');
    }

    if (!connection) {
      // Try again later, removing progress to bar to avoid confusion
      if (creds.connectionTries < 5) {
        credentials.push(creds);
      }
      outputResult(creds, connection, i18n.t('sushi.testAll.noResult', { credsName }), false);
      continue;
    }

    // Friendly status, message and exception
    const oldStatus = chalk.stderr.underline(creds.connection?.status || 'untested');
    const reason = i18n.t('sushi.testAll.result', { credsName, status: chalk.underline(connection.status), oldStatus });
    const exceptionMessage = connection.exceptions?.length > 0 ? `[${connection.exceptions[0].Severity}] ${connection.exceptions[0].Code} - ${connection.exceptions[0].Message}` : undefined;

    if (connection.status === 'failed') {
      outputResult(creds, connection, `${reason}\n\t${exceptionMessage}`);
      continue;
    }

    if (connection.status === 'unauthorized') {
      outputResult(creds, connection, `${reason}\n\t${exceptionMessage}`);
      continue;
    }

    outputResult(creds, connection, reason);

    await setTimeout(1000);
  }

  progress.stop();

  const numberFormat = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatCell = (count) => {
    const percentage = (count / (credentialsCount || 1));
    if (percentage > 0.1) {
      return `${count} (${numberFormat.format(percentage * 100)}%)`;
    }
    return `${count}`;
  };

  // Print table
  process.stderr.write(
    table([
      [
        chalk.bold(i18n.t('endpoints.harvestable.executionDate')),
        chalk.bold(i18n.t('endpoints.harvestable.executionPeriod')),
        chalk.bold(i18n.t('sushi.testAll.status.success')),
        chalk.bold(i18n.t('sushi.testAll.status.unauthorized')),
        chalk.bold(i18n.t('sushi.testAll.status.failed')),
        chalk.bold(i18n.t('sushi.testAll.status.total')),
      ],
      [
        `${format(new Date(), 'P')}`,
        `${period.start} ~ ${period.end}`,
        chalk.green(`✓ ${formatCell(credentialsStatuses.success || 0)}`),
        chalk.yellow(`x ${formatCell(credentialsStatuses.unauthorized || 0)}`),
        chalk.red(`! ${formatCell(credentialsStatuses.failed || 0)}`),
        credentialsCount,
      ],
    ]),
  );
  process.stderr.write('\n');
};
