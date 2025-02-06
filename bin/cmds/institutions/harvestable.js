/* eslint-disable no-continue */
const { i18n } = global;

const chalk = require('chalk');
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
  parse,
} = require('date-fns');

const { initProgress, logAlongProgress } = require('../../../lib/progress');
const institutionsLib = require('../../../lib/institutions');
const sushiLib = require('../../../lib/sushi');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'harvestable';
exports.desc = i18n.t('institutions.harvestable.description');
exports.builder = (yargs) => yargs
  .option('unharvested-after', {
    type: 'string',
    describe: i18n.t('institutions.harvestable.options.unharvestedAfter'),
  })
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
  })
  .option('required', {
    type: 'string',
    choices: ['one', 'all'],
    default: 'one',
    describe: i18n.t('institutions.harvestable.options.required'),
  });

const sortByDateDesc = (a, b) => parseISO(b.harvestedAt) - parseISO(a.harvestedAt);
const sortByPeriodDesc = (a, b) => b.period.localeCompare(a.period);

exports.handler = async function handler(argv) {
  const {
    unharvestedAfter,
    allowFaulty = false,
    allowNotReady = false,
    allowHarvested = false,
    format: outputFormat,
    ignoreHarvest: ignoredHarvestDates = [],
    verbose,
  } = argv;

  let harvestedMonth;
  if (unharvestedAfter) {
    const parsedPeriod = parse(unharvestedAfter, 'yyyy-MM', new Date());
    if (!isValid(parsedPeriod)) {
      console.error(i18n.t('institutions.harvestable.invalidPeriod', { period: unharvestedAfter }));
      process.exit(1);
    }
    harvestedMonth = unharvestedAfter;
  }

  const isNotIgnoredHarvestDay = (harvest) => !ignoredHarvestDates.some(
    (date) => isSameDay(parseISO(date), parseISO(harvest.harvestedAt)),
  );

  const allEndpointsMustBeUnharvested = argv.required === 'all';

  if (verbose) {
    logAlongProgress(`Fetching institutions from ${config.ezmesure.baseUrl}\n`, 'grey');
  }

  let institutions;
  try {
    institutions = (await institutionsLib.getAll({})).data;
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
        include: ['harvests', 'endpoint'],
      })).data;
    } catch (error) {
      progress.stop();
      console.error(formatApiError(error));
      process.exit(1);
    }

    sushiCredentials = sushiCredentials.filter(
      (cred) => cred.active && (cred.endpoint?.active ?? true),
    );

    if (sushiCredentials.length <= 0) {
      skip(i18n.t('institutions.harvestable.institutionHasNoCredentials', { name: chalk.stderr.bold(institution.name) }));
      continue;
    }

    let lastPeriod;
    let lastHarvestDate;
    let harvestedCredentialsCount = 0;

    const counts = {
      success: 0,
      failed: 0,
      unauthorized: 0,
      untested: 0,
      total: sushiCredentials.length,
    };

    for (const { connection, harvests } of sushiCredentials) {
      const status = connection?.status ?? 'untested';
      counts[status] = (counts[status] ?? 0) + 1;
      // Failed credentials will not be harvested,
      // so we ignore them but still count them as harvested
      if (status === 'failed') {
        if (!allEndpointsMustBeUnharvested) {
          harvestedCredentialsCount += 1;
        }
        continue;
      }

      // Check if the specified month isn't harvested
      let harvestedForDate;
      if (harvestedMonth) {
        const lastPeriodHarvest = harvests.sort(sortByPeriodDesc).find(isNotIgnoredHarvestDay);
        const period = lastPeriodHarvest?.period ?? '';
        harvestedForDate = period >= harvestedMonth;
        lastPeriod = period >= (lastPeriod ?? '') ? period : lastPeriod;
      }

      // Check if the institution is ready after last harvest
      const lastHarvest = harvests.sort(sortByDateDesc).find(isNotIgnoredHarvestDay);
      const harvestedAt = lastHarvest?.harvestedAt ? parseISO(lastHarvest?.harvestedAt) : undefined;
      const harvestedSinceReady = isValid(harvestedAt) && isAfter(harvestedAt, readySince);

      // We want to harvest if the institution is ready after last harvest
      // or if the specified month isn't harvested
      // or if both are true
      const harvested = harvestedSinceReady && harvestedForDate;
      if (harvested) { harvestedCredentialsCount += 1; }

      if (isValid(harvestedAt)) {
        lastHarvestDate = lastHarvestDate ? Math.max(harvestedAt, lastHarvestDate) : harvestedAt;
      }
    }

    // Failed credentials will not be harvested, but still counted as valid credentials when
    // checking if institution is harvestable
    const validCredentialsCount = (counts.success ?? 0) + (counts.failed ?? 0);

    if (!allowFaulty && validCredentialsCount < counts.total) {
      skip(i18n.t('institutions.harvestable.institutionHasFaultyCredentials', { name: chalk.stderr.bold(institution.name) }));
      continue;
    }

    const harvested = allEndpointsMustBeUnharvested
      ? harvestedCredentialsCount > 0
      : harvestedCredentialsCount === counts.total;

    if (harvested && !allowHarvested) {
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
      progress.stop();
      console.error(formatApiError(error));
      process.exit(1);
    }

    institutionsReady.push({
      institution,
      sushiCredentials,
      readySince: isValid(readySince) ? format(readySince, 'yyyy-MM-dd') : undefined,
      lastHarvest: isValid(lastHarvestDate) ? format(lastHarvestDate, 'yyyy-MM-dd') : undefined,
      lastPeriod,
      contacts,
      counts,
      harvestedCredentialsCount,
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
        lastPeriod: i.lastPeriod,
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
        chalk.bold(i18n.t('institutions.harvestable.harvested')),
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
          `${r.harvestedCredentialsCount} / ${r.sushiCredentials.length}`,
        ];
      }),
    ]),
  );
  process.stdout.write('\n');
};
