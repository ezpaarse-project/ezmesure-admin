const { i18n } = global;

const chalk = require('chalk');
const { table } = require('table');
const { parseISO, formatDistance, format } = require('date-fns');

const tasksLib = require('../../../lib/tasks');
const harvestLib = require('../../../lib/harvest');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');
const { printSystemctlStyle } = require('./utils/format');

exports.command = 'status <harvestId>';
exports.desc = i18n.t('harvest.status.description');
exports.builder = (yargs) => yargs
  .positional('harvestId', {
    describe: i18n.t('harvest.status.options.harvestId'),
    type: 'string',
  })
  .option('credentials', {
    describe: i18n.t('harvest.status.options.credentials'),
    type: 'boolean',
    conflicts: ['jobs', 'watch', 'watchDelay'],
    group: 'Output :',
  })
  .option('jobs', {
    describe: i18n.t('harvest.status.options.jobs'),
    type: 'boolean',
    conflicts: ['credentials'],
    group: 'Output :',
  })
  .option('watch', {
    describe: i18n.t('harvest.status.options.watch'),
    type: 'boolean',
    group: 'Watch :',
  })
  .option('watchDelay', {
    describe: i18n.t('harvest.status.options.watchDelay'),
    type: 'number',
    implies: 'watch',
    group: 'Watch :',
  })
  .option('format', {
    type: 'string',
    choices: ['json', 'ndjson'],
    describe: i18n.t('harvest.status.options.format'),
  });

const DEF_WATCH_DELAY = 5000;

const DEF_TIMEOUT = 600;
const DEF_ALLOW_FAULTY = false;
const DEF_DOWNLOAD_UNSUPPORTED = false;
const DEF_FORCE_DOWNLOAD = false;
const DEF_IGNORE_VALIDATION = null;

const out = process.stdout;
const moveCursor = (dx, dy) => new Promise((resolve) => out.moveCursor(dx, dy, resolve));
const cursorTo = (x, y) => new Promise((resolve) => out.cursorTo(x, y, resolve));
const clearScreenDown = () => new Promise((resolve) => out.clearScreenDown(resolve));

const formatDuration = (ms) => formatDistance(0, ms, { includeSeconds: true });

const printOrWatch = async (fnc, argv) => {
  const {
    harvestId,
    watch,
    watchDelay,
    verbose,
  } = argv;

  let interval;
  let printedLines = 0;

  const printSessionStatus = async () => {
    if (printedLines > 0) {
      if (process.stdout.isTTY) {
        await moveCursor(0, -printedLines);
        await cursorTo(0);
        await clearScreenDown();
      }
      printedLines = 0;
    }

    if (verbose) {
      console.log(
        chalk.gray(`Fetching status of harvest session ${harvestId} from ${config.ezmesure.baseUrl}`),
      );
      printedLines += 1;
    }

    let sessionStatus;
    try {
      sessionStatus = (await harvestLib.getStatuses([harvestId])).data[harvestId];
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    if (!sessionStatus) {
      console.error(i18n.t('harvest.status.notFound', { harvestId }));
      process.exit(1);
    }

    printedLines += await fnc(sessionStatus, argv);

    return sessionStatus;
  };

  const watchFnc = async () => {
    const sessionStatus = await printSessionStatus();

    if (!sessionStatus.isActive) {
      clearInterval(interval);
    }
  };

  const sessionStatus = await printSessionStatus();
  if (watch && sessionStatus.isActive) {
    interval = setInterval(watchFnc, watchDelay || DEF_WATCH_DELAY);
  }
};

const printHarvestStatus = async (sessionStatus, argv) => {
  const { harvestId, output: outputFormat, verbose } = argv;

  let printedLines = 0;
  if (verbose) {
    console.log(
      chalk.gray(`Fetching status of harvest session ${harvestId} from ${config.ezmesure.baseUrl}`),
    );
    printedLines += 1;
  }

  let session;
  try {
    session = (await harvestLib.getOne(harvestId)).data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (!session || !sessionStatus) {
    console.error(i18n.t('harvest.status.notFound', { harvestId }));
    process.exit(1);
  }

  if (outputFormat === 'json') {
    console.log(JSON.stringify({ session, sessionStatus }, null, 2));
    printedLines += 1;
    return printedLines;
  }

  const {
    beginDate,
    endDate,
    reportTypes,
    timeout = DEF_TIMEOUT,
    allowFaulty = DEF_ALLOW_FAULTY,
    downloadUnsupported = DEF_DOWNLOAD_UNSUPPORTED,
    forceDownload = DEF_FORCE_DOWNLOAD,
    ignoreValidation = DEF_IGNORE_VALIDATION,
  } = session;

  let chip = '●';
  let state = chalk.yellow(i18n.t('harvest.status.states.prepared'));
  let date = parseISO(session.updatedAt);
  if (session.startedAt) {
    chip = chalk.blue(chip);
    state = chalk.blue(i18n.t('harvest.status.states.ended'));
    date = parseISO(session.startedAt);
  }
  if (sessionStatus.isActive) {
    chip = chalk.green(chip);
    state = chalk.green(i18n.t('harvest.status.states.active'));
    date = parseISO(session.startedAt);
  }

  console.log(i18n.t('harvest.status.header', {
    harvestId,
    chip,
    beginDate,
    endDate,
  }));
  printedLines += 1;

  const jobStatuses = [...Object.entries(sessionStatus._count.jobStatuses)]
    .map(([value, header]) => ({ header, value }));

  const { harvestable, all } = sessionStatus._count.credentials;

  printedLines += printSystemctlStyle({
    reportTypes: reportTypes.join(', ').toUpperCase(),
    timeout: { value: timeout, def: DEF_TIMEOUT },
    allowFaulty: { value: allowFaulty, def: DEF_ALLOW_FAULTY },
    downloadUnsupported: { value: downloadUnsupported, def: DEF_DOWNLOAD_UNSUPPORTED },
    forceDownload: { value: forceDownload, def: DEF_FORCE_DOWNLOAD },
    ignoreValidation: { value: ignoreValidation, def: DEF_IGNORE_VALIDATION },
    credentials: i18n.t('harvest.status.credentialsText', { harvestable: chalk.underline(harvestable), all: chalk.underline(all) }),
    state: i18n.t('harvest.status.stateText', { state, date: chalk.underline(format(date, 'yyyy-MM-dd HH:mm:ss')) }),
    runningTime: sessionStatus.runningTime && formatDuration(sessionStatus.runningTime),
    jobs: { value: session._count.jobs, items: jobStatuses },
  });

  return printedLines;
};

const printCredentials = async (argv) => {
  const { harvestId, format: outputFormat, verbose } = argv;

  let printedLines = 0;

  if (verbose) {
    console.log(
      chalk.gray(`Fetching credentials of harvest session ${harvestId} from ${config.ezmesure.baseUrl}`),
    );
    printedLines += 1;
  }

  let credentials;
  try {
    credentials = (await harvestLib.getCredentials(harvestId, { include: ['endpoint', 'institution'] })).data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (outputFormat === 'json') {
    console.log(JSON.stringify(credentials, null, 2));
    printedLines += 1;
    return printedLines;
  }

  if (outputFormat === 'ndjson') {
    credentials.forEach((c) => console.log(JSON.stringify(c)));
    printedLines += credentials.length;
    return printedLines;
  }

  const t = table([
    [
      chalk.bold(i18n.t('harvest.status.institution')),
      chalk.bold(i18n.t('harvest.status.endpoint')),
      chalk.bold(i18n.t('harvest.status.tags')),
      chalk.bold(i18n.t('harvest.status.connection')),
      chalk.bold(i18n.t('harvest.status.updatedAt')),
    ],
    ...credentials.map((c) => {
      let connection = c.connection?.status;
      switch (connection) {
        case 'success':
          connection = chalk.green(connection);
          break;
        case 'unauthorized':
          connection = chalk.yellow(connection);
          break;
        case 'failed':
          connection = chalk.red(connection);
          break;

        default:
          connection = chalk.grey('untested');
          break;
      }

      return [
        c.institution.name,
        c.endpoint.vendor,
        c.tags.join(', '),
        connection,
        format(parseISO(c.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
      ];
    }),
  ]);

  console.log(t);
  printedLines += t.split('\n').length;
  return printedLines;
};

const printJobs = async (session, argv) => {
  const {
    harvestId,
    format: outputFormat,
    verbose,
  } = argv;

  let printedLines = 0;

  if (verbose) {
    console.log(
      chalk.gray(`Fetching jobs of harvest session ${harvestId} from ${config.ezmesure.baseUrl}`),
    );
    printedLines += 1;
  }

  let jobs;
  try {
    jobs = (await tasksLib.getAll({ sessionId: harvestId })).data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (outputFormat === 'json') {
    console.log(JSON.stringify(jobs, null, 2));
    printedLines += 1;
    return printedLines;
  }

  if (outputFormat === 'ndjson') {
    jobs.forEach((j) => console.log(JSON.stringify(j)));
    printedLines += jobs.length;
    return printedLines;
  }

  const t = table([
    [
      chalk.bold(i18n.t('harvest.status.jobId')),
      chalk.bold(i18n.t('harvest.status.credentialsId')),
      chalk.bold(i18n.t('harvest.status.reportTypes')),
      chalk.bold(i18n.t('harvest.status.index')),
      chalk.bold(i18n.t('harvest.status.runningTime')),
      chalk.bold(i18n.t('harvest.status.jobStatus')),
      chalk.bold(i18n.t('harvest.status.errorCode')),
      chalk.bold(i18n.t('harvest.status.updatedAt')),
      chalk.bold(i18n.t('harvest.status.startedAt')),
    ],
    ...jobs.map((j) => {
      let { status } = j;
      switch (status) {
        case 'finished':
          status = chalk.green(status);
          break;
        case 'waiting':
          status = chalk.grey(status);
          break;
        case 'running':
        case 'delayed':
          status = chalk.yellow(status);
          break;

        default:
          status = chalk.red(status);
          break;
      }

      return [
        j.id,
        j.credentialsId,
        j.reportType,
        j.index,
        j.runningTime,
        status,
        j.errorCode || '',
        format(parseISO(j.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
        j.startedAt && format(parseISO(j.startedAt), 'yyyy-MM-dd HH:mm:ss'),
      ];
    }),
  ]);

  console.log(t);
  printedLines += t.split('\n').length;
  return printedLines;
};

exports.handler = async function handler(argv) {
  const { credentials, jobs } = argv;

  if (credentials) {
    await printCredentials(argv);
    return;
  }

  if (jobs) {
    printOrWatch(printJobs, argv);
    return;
  }

  printOrWatch(printHarvestStatus, argv);
};
