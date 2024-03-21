/* eslint-disable no-continue */
const { i18n } = global;

const chalk = require('chalk');
const { MultiBar, Presets } = require('cli-progress');
const { table } = require('table');
const {
  format,
  parseISO,
  isValid,
  isAfter,
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
    default: false,
  })
  .option('allow-not-ready', {
    type: 'boolean',
    describe: i18n.t('institutions.harvestable.options.allowNotReady'),
    default: false,
  })
  .option('j', {
    alias: 'json',
    describe: i18n.t('institutions.get.options.json'),
    type: 'boolean',
    conflicts: ['n'],
  })
  .option('n', {
    alias: 'ndjson',
    describe: i18n.t('institutions.get.options.ndjson'),
    type: 'boolean',
    conflicts: ['j'],
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
    allowFaulty,
    allowNotReady,
    json,
    ndjson,
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
    const { sushiReadySince } = institution;

    const readySince = sushiReadySince && parseISO(sushiReadySince);
    if (!allowNotReady && (!isValid(readySince) || isAfter(readySince, now))) {
      skip(i18n.t('institutions.harvestable.institutionIsNotReady', { name: institution.name }));
      continue;
    }

    if (verbose) {
      progress.log(`Fetching sushi credentials of ${institution.name}...`, 'grey');
    }

    let sushiCredentials;
    try {
      // eslint-disable-next-line no-await-in-loop
      sushiCredentials = (await sushiLib.getAll({ institutionId: institution.id, include: ['harvests'] })).data;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    if (sushiCredentials.length <= 0) {
      skip(i18n.t('institutions.harvestable.institutionHasNoCredentials', { name: institution.name }));
      continue;
    }

    let lastHarvestDate = -Infinity;
    const counts = {};
    for (const { connection, harvests } of sushiCredentials) {
      const status = connection?.status;
      if (status) {
        counts[status] = (counts[status] ?? 0) + 1;

        const [lastHarvest] = harvests.sort(
          (a, b) => parseISO(b.harvestedAt) - parseISO(a.harvestedAt),
        );

        lastHarvestDate = Math.max(
          lastHarvest?.harvestedAt ? parseISO(lastHarvest.harvestedAt) : -Infinity,
          lastHarvestDate,
        );
      }
    }

    const validCredentialsCount = (counts.success ?? 0) + (counts.failed ?? 0);
    if (!allowFaulty && validCredentialsCount < sushiCredentials.length) {
      skip(i18n.t('institutions.harvestable.institutionHasFaultyCredentials', { name: institution.name }));
      continue;
    }

    if (isValid(lastHarvestDate) && isAfter(lastHarvestDate, readySince)) {
      skip(i18n.t('institutions.harvestable.institutionIsHarvested', { name: institution.name }));
      continue;
    }

    let memberships;
    try {
      memberships = (await institutionsLib.getMembers(institution.id, { include: ['user'] })).data;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    institutionsReady.push({
      institution,
      sushiCredentials,
      readySince: isValid(readySince) ? format(readySince, 'yyyy-MM-dd') : undefined,
      lastHarvest: isValid(lastHarvestDate) ? format(lastHarvestDate, 'yyyy-MM-dd') : undefined,
      contacts: memberships.filter((m) => m.roles.includes('contact:doc')),
      counts,
      validCredentialsCount,
    });
    progress.log(i18n.t('institutions.harvestable.institutionIsReady', { name: institution.name }), 'green');
    progress.bar?.increment();
  }

  progress.stop();
  log(`\n${i18n.t('institutions.harvestable.nbInstitutionsReady', { count: institutionsReady.length })}`, 'green');

  if (json) {
    process.stdout.write(`${JSON.stringify(institutionsReady, null, 2)}\n`);
    return;
  }

  if (ndjson) {
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
