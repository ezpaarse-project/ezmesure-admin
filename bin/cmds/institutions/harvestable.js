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
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'harvestable';
exports.desc = i18n.t('institutions.harvestable.description');
exports.builder = (yargs) => yargs
  .option('allow-faulty', {
    type: 'boolean',
    describe: i18n.t('harvest.prepare.options.allowFaulty'),
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
    if (!isValid(readySince) || isAfter(readySince, now)) {
      skip(`${institution.name} is not ready yet.`);
      continue;
    }

    if (verbose) {
      progress.log(`Fetching sushi credentials of ${institution.name}...`, 'grey');
    }
    // eslint-disable-next-line no-await-in-loop
    const sushiCredentials = (await institutionsLib.getSushi(institution.id, { include: ['harvests'] })).data;

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
    const total = (counts.success ?? 0) + (counts.failed ?? 0);
    if (!allowFaulty && total < sushiCredentials.length) {
      skip(`${institution.name} didn't tested & fixed all their credentials.`);
      continue;
    }

    if (isValid(lastHarvestDate) && isAfter(lastHarvestDate, readySince)) {
      skip(`${institution.name} are already harvested.`);
      continue;
    }

    institutionsReady.push({
      institution,
      readySince: format(readySince, 'yyyy-MM-dd'),
      lastHarvest: isValid(lastHarvestDate) ? format(lastHarvestDate, 'yyyy-MM-dd') : undefined,
      counts,
      total,
    });
    progress.log(`${institution.name} is ready to be harvested.`, 'green');
    progress.bar?.increment();
  }

  progress.stop();
  log(`\n${institutionsReady.length} institutions ready.`, 'green');

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
        chalk.bold('Name'),
        chalk.bold('Ready since'),
        chalk.bold('Last harvest'),
        chalk.bold('Credentials'),
      ],
      ...institutionsReady.map((r) => {
        let credStatus = `${chalk.green(`✓ ${r.counts.success}`)} ${chalk.red(`x ${r.counts.failed}`)}`;
        if (allowFaulty) {
          credStatus += ` ${chalk.yellow(`! ${r.counts.unauthorized}`)}`;
        }
        credStatus += ` /${r.total}`;

        return [
          r.institution.name,
          r.readySince,
          r.lastHarvest,
          credStatus,
        ];
      }),
    ]),
  );
  process.stdout.write('\n');
};
