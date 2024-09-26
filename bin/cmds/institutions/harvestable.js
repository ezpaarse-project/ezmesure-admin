/* eslint-disable no-continue */
const { i18n } = global;

const chalk = require('chalk');
const { MultiBar, Presets } = require('cli-progress');
const { table } = require('table');
const { default: slugify } = require('slugify');
const {
  format,
  parseISO,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  isValid,
  isAfter,
  isSameDay,
} = require('date-fns');

const institutionsLib = require('../../../lib/institutions');
const sushiLib = require('../../../lib/sushi');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'harvestable';
exports.desc = i18n.t('institutions.harvestable.description');
exports.builder = (yargs) => yargs
  .option('allow-faulty', {
    type: 'boolean',
    describe: i18n.t('harvest.prepare.options.allowFaulty'),
  })
  .option('allow-not-ready', {
    type: 'boolean',
    describe: i18n.t('institutions.harvestable.options.allowNotReady'),
  })
  .option('allow-harvested', {
    type: 'boolean',
    describe: i18n.t('institutions.harvestable.options.allowHarvested'),
  })
  .option('ignore-harvest', {
    type: 'string',
    array: true,
    describe: i18n.t('institutions.harvestable.options.ignoreHarvestDate'),
    conflicts: ['allow-harvested'],
  })
  .option('format', {
    type: 'string',
    choices: ['json', 'ndjson', 'harvest-options'],
    describe: i18n.t('institutions.harvestable.options.format'),
  });

const log = (message, color) => {
  const msg = color ? chalk.stderr[color](message) : message;
  process.stderr.write(`${msg}\n`);
};

const initProgress = (opts) => {
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
};

exports.handler = async function handler(argv) {
  const {
    allowFaulty = false,
    allowNotReady = false,
    allowHarvested = false,
    format: outputFormat,
    ignoreHarvest: ignoredHarvestDates = [],
    verbose,
  } = argv;

  if (verbose) {
    log(`Fetching institutions from ${config.ezmesure.baseUrl}\n`, 'grey');
  }

  let institutions;
  try {
    institutions = (await institutionsLib.getAll()).data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  const progress = initProgress({ total: institutions.length });

  const skip = (reason) => {
    progress.log(reason, 'red');
    progress.bar?.increment();
  };

  const now = new Date();
  const institutionsReady = [];
  for (const institution of institutions) {
    if (verbose) {
      progress.log(`Checking ${institution.name}...`, 'grey');
    }
    const { sushiReadySince } = institution;

    const readySince = sushiReadySince && parseISO(sushiReadySince);
    if (!allowNotReady && (!isValid(readySince) || isAfter(readySince, now))) {
      skip(i18n.t('institutions.harvestable.institutionIsNotReady', { name: chalk.stderr.bold(institution.name) }));
      continue;
    }

    if (verbose) {
      progress.log(`Fetching sushi credentials of ${chalk.stderr.bold(institution.name)}...`, 'grey');
    }

    let sushiCredentials;
    try {
      // eslint-disable-next-line no-await-in-loop
      sushiCredentials = (await sushiLib.getAll({
        institutionId: institution.id,
        active: true,
        include: ['harvests', 'endpoint'],
      })).data;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    if (sushiCredentials.length <= 0) {
      skip(i18n.t('institutions.harvestable.institutionHasNoCredentials', { name: chalk.stderr.bold(institution.name) }));
      continue;
    }

    let lastHarvestDate = -Infinity;
    const counts = {
      success: 0,
      failed: 0,
      unauthorized: 0,
      untested: 0,
      total: 0,
    };
    for (const { connection, harvests, endpoint } of sushiCredentials) {
      if (!endpoint.active) {
        continue;
      }

      const status = connection?.status ?? 'untested';
      counts[status] = (counts[status] ?? 0) + 1;

      let lastHarvest;
      const sortedHarvest = harvests.sort(
        (a, b) => parseISO(b.harvestedAt) - parseISO(a.harvestedAt),
      );
      for (const harvest of sortedHarvest) {
        if (!ignoredHarvestDates.some((date) => isSameDay(date, harvest.harvestedAt))) {
          lastHarvest = harvest;
          break;
        }
      }

      lastHarvestDate = Math.max(
        lastHarvest?.harvestedAt ? parseISO(lastHarvest.harvestedAt) : -Infinity,
        lastHarvestDate,
      );
      counts.total += 1;
    }

    const validCredentialsCount = (counts.success ?? 0) + (counts.failed ?? 0);
    if (!allowFaulty && validCredentialsCount < counts.total) {
      skip(i18n.t('institutions.harvestable.institutionHasFaultyCredentials', { name: chalk.stderr.bold(institution.name) }));
      continue;
    }

    if (!allowHarvested && isValid(lastHarvestDate) && isAfter(lastHarvestDate, readySince)) {
      skip(i18n.t('institutions.harvestable.institutionIsHarvested', { name: chalk.stderr.bold(institution.name) }));
      continue;
    }

    let contacts;
    try {
      contacts = (await institutionsLib.getMembers(institution.id, {
        roles: ['contact:doc'],
        include: ['user'],
      })).data;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    institutionsReady.push({
      institution,
      sushiCredentials,
      readySince: isValid(readySince) ? format(readySince, 'yyyy-MM-dd') : undefined,
      lastHarvest: isValid(lastHarvestDate) ? format(lastHarvestDate, 'yyyy-MM-dd') : undefined,
      contacts,
      counts,
      validCredentialsCount,
    });
    progress.log(i18n.t('institutions.harvestable.institutionIsReady', { name: chalk.stderr.bold(institution.name) }), 'green');
    progress.bar?.increment();
  }

  progress.stop();

  if (outputFormat === 'harvest-options') {
    const threeMonthAgo = subMonths(now, 3);
    const harvestSessions = institutionsReady.map((i) => ({
      harvestId: `${format(now, 'yyyy-MM-dd')}_${slugify(i.institution.name.toLowerCase())}_${format(now, 'yyyy')}`,
      from: format(startOfQuarter(threeMonthAgo), 'yyyy-MM'),
      to: format(endOfQuarter(threeMonthAgo), 'yyyy-MM'),
      institutions: [{
        id: i.institution.id,
        name: i.institution.name,
        contacts: i.contacts.map((c) => c.user.email),
        readySince: i.readySince,
        lastHarvest: i.lastHarvest,
        counts: i.counts,
      }],
    }));
    process.stdout.write(`${JSON.stringify(harvestSessions, null, 2)}\n`);
    return;
  }

  if (outputFormat === 'json') {
    process.stdout.write(`${JSON.stringify(institutionsReady, null, 2)}\n`);
    return;
  }

  if (outputFormat === 'ndjson') {
    institutionsReady.forEach((r) => process.stdout.write(`${JSON.stringify(r)}\n`));
    return;
  }

  process.stdout.write(
    table([
      [
        chalk.bold(i18n.t('institutions.harvestable.name')),
        chalk.bold(i18n.t('institutions.harvestable.contacts')),
        chalk.bold(i18n.t('institutions.harvestable.readySince')),
        chalk.bold(i18n.t('institutions.harvestable.lastHarvest')),
        chalk.bold(i18n.t('institutions.harvestable.credentials')),
      ],
      ...institutionsReady.map((r) => {
        let credStatus = '';
        if (r.counts.success) {
          credStatus += `${chalk.green(`✓ ${r.counts.success}`)}`;
        }
        if (r.counts.failed) {
          credStatus += ` ${chalk.red(`x ${r.counts.failed}`)}`;
        }
        if (allowFaulty && r.counts.unauthorized) {
          credStatus += ` ${chalk.yellow(`! ${r.counts.unauthorized}`)}`;
        }
        credStatus += ` /${r.sushiCredentials.length}`;

        return [
          r.institution.name,
          r.contacts.map((m) => m.user.email || m.user.username).join('\n'),
          r.readySince || chalk.red(i18n.t('institutions.harvestable.notReady')),
          r.lastHarvest || chalk.red(i18n.t('institutions.harvestable.neverHarvested')),
          credStatus,
        ];
      }),
    ]),
  );
  process.stdout.write('\n');
};
