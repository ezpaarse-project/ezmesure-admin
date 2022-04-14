const { i18n } = global;

const { table } = require('table');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const formatDate = require('date-fns/format');
const subMonths = require('date-fns/subMonths');
const parseDate = require('date-fns/parse');
const isValidDate = require('date-fns/isValid');

const itMode = require('./interactive/harvest');
const sushiLib = require('../../../lib/sushi');
const endpointsLib = require('../../../lib/endpoints');
const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

const coloredStatus = (status = '') => {
  if (status === 'running') { return chalk.blue(status); }
  if (status === 'interrupted') { return chalk.red(status); }
  if (status === 'error') { return chalk.red(status); }
  if (status === 'finished') { return chalk.green(status); }
  return chalk.white(status);
};

exports.command = 'harvest';
exports.desc = i18n.t('sushi.harvest.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('interactive', {
      alias: 'it',
      type: 'boolean',
      describe: i18n.t('sushi.harvest.options.interactive'),
    })
    .option('all', {
      alias: 'a',
      type: 'boolean',
      describe: i18n.t('sushi.harvest.options.all'),
    })
    .option('from', {
      type: 'string',
      describe: i18n.t('sushi.harvest.options.from'),
    })
    .option('to', {
      type: 'string',
      describe: i18n.t('sushi.harvest.options.to'),
    })
    .option('t', {
      alias: 'target',
      type: 'string',
      describe: i18n.t('sushi.harvest.options.target'),
    })
    .option('reportType', {
      alias: 'rt',
      type: 'string',
      describe: i18n.t('sushi.harvest.options.reportType'),
    })
    .option('harvestId', {
      alias: 'hid',
      type: 'string',
      describe: i18n.t('sushi.harvest.options.harvestId'),
    })
    .option('sushiId', {
      alias: 's',
      type: 'array',
      describe: i18n.t('sushi.harvest.options.sushiId'),
    })
    .option('institutionId', {
      alias: 'i',
      type: 'array',
      describe: i18n.t('sushi.harvest.options.institutionId'),
    })
    .option('endpointId', {
      alias: 'e',
      type: 'array',
      describe: i18n.t('sushi.harvest.options.endpointId'),
    })
    .option('allow-faulty', {
      type: 'boolean',
      describe: i18n.t('sushi.harvest.options.allowFaulty'),
    })
    .option('ignore-validation', {
      type: 'boolean',
      describe: i18n.t('sushi.harvest.options.ignoreValidation'),
    })
    .option('json', {
      describe: i18n.t('sushi.harvest.options.json'),
      type: 'boolean',
    })
    .option('ndjson', {
      describe: i18n.t('sushi.harvest.options.ndjson'),
      type: 'boolean',
    })
    .option('no-cache', {
      describe: i18n.t('sushi.harvest.options.noCache'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    interactive,
    all,
    target,
    cache,
    verbose,
    allowFaulty,
    ignoreValidation,
    $0: scriptName,
  } = argv;

  let {
    from: beginDate,
    to: endDate,
    sushiId: sushiIds,
    institutionId: institutionIds,
    endpointId: endpointIds,
    harvestId,
    reportType,
  } = argv;

  if (!Array.isArray(institutionIds)) { institutionIds = []; }
  if (!Array.isArray(endpointIds)) { endpointIds = []; }
  if (!Array.isArray(sushiIds)) { sushiIds = []; }

  const results = [];

  if (interactive) {
    reportType = await itMode.list(i18n.t('sushi.harvest.selectReportType'), [
      { name: 'Title Report', value: 'tr' },
      { name: 'Item Report', value: 'ir' },
      { name: 'Platform Report', value: 'pr' },
      { name: 'Database Report', value: 'dr' },
    ]);

    const harvestAllInstitutions = await itMode.confirm(i18n.t('sushi.harvest.harvestAllInstitutions'), false);

    if (!harvestAllInstitutions) {
      if (verbose) {
        console.log(`* Fetch institutions from ${config.ezmesure.baseUrl}`);
      }
      let allInstitutions;

      try {
        ({ data: allInstitutions } = await institutionsLib.getAll());
      } catch (e) {
        console.error(formatApiError(e));
        process.exit(1);
      }

      institutionIds = await itMode.selectMultiple(
        i18n.t('sushi.harvest.selectInstitutions'),
        Array.from(allInstitutions).map((i) => ({ name: i.name, value: i.id })),
      );
    }

    const harvestAllEndpoints = await itMode.confirm(i18n.t('sushi.harvest.harvestAllEndpoints'), false);

    if (!harvestAllEndpoints) {
      if (verbose) {
        console.log(`* Fetch SUSHI endpoints from ${config.ezmesure.baseUrl}`);
      }
      let allEndpoints;

      try {
        ({ data: allEndpoints } = await endpointsLib.getAll());
      } catch (e) {
        console.error(formatApiError(e));
        process.exit(1);
      }

      endpointIds = await itMode.selectMultiple(
        i18n.t('sushi.harvest.selectEndpoints'),
        allEndpoints.map((endpoint) => {
          const { tags, id: value } = endpoint;
          let name = endpoint.vendor || '';

          if (Array.isArray(tags) && tags.length > 0) {
            const tagsSuffix = `(tags: ${tags.join(', ')})`;
            name = `${name} ${chalk.grey(tagsSuffix)}`;
          }
          return { name, value };
        }),
      );
    }
  }

  if (verbose) {
    console.log(`* Fetch SUSHI credentials from ${config.ezmesure.baseUrl}`);
  }

  const hasFilters = (institutionIds.length + endpointIds.length + sushiIds.length) > 0;

  if (!hasFilters && !all) {
    console.error(i18n.t('sushi.harvest.noFilter'));
    console.error(i18n.t('sushi.harvest.pleaseSetAllFlag'));
    process.exit(1);
  }

  const params = {};
  let sushiItems;

  if (institutionIds.length > 0) {
    params.institutionId = institutionIds.join(',');
  }
  if (endpointIds.length > 0) {
    params.endpointId = endpointIds.join(',');
  }
  if (sushiIds.length > 0) {
    params.id = sushiIds.join(',');
  }
  if (!allowFaulty) {
    params.connection = 'working';
  }

  try {
    ({ data: sushiItems } = await sushiLib.getAll(params));
  } catch (e) {
    console.error(formatApiError(e));
    process.exit(1);
  }

  if (interactive) {
    sushiItems = await itMode.selectMultiple(
      i18n.t('sushi.harvest.selectSushiCredentials'),
      sushiItems.map((sushi) => {
        const packageName = chalk.grey(`[${sushi.package}]`);
        let statusIcon = chalk.grey('?');

        if (sushi?.connection?.success === true) {
          statusIcon = chalk.green('✓');
        } else if (sushi?.connection?.success === false) {
          statusIcon = chalk.red('✕');
        }

        return {
          name: `${statusIcon} ${sushi.vendor} ${packageName}`,
          value: sushi,
        };
      }),
      sushiItems.filter((sushi) => sushi?.connection?.success === true),
    );

    const validateDate = (input) => {
      if (isValidDate(parseDate(input, 'yyyy-MM', new Date()))) {
        return true;
      }
      return i18n.t('sushi.harvest.invalidDate');
    };

    const lastMonth = formatDate(subMonths(new Date(), 1), 'yyyy-MM');

    beginDate = await itMode.input({
      message: 'Harvest from (yyyy-MM)',
      default: beginDate || lastMonth,
      validate: validateDate,
    });
    endDate = await itMode.input({
      message: 'Harvest to (yyyy-MM)',
      default: endDate || lastMonth,
      validate: validateDate,
    });
  }

  if (interactive) {
    harvestId = await itMode.input({
      message: i18n.t('sushi.harvest.harvestId'),
      default: harvestId,
    });
  }

  if (!harvestId?.trim?.()) {
    harvestId = uuidv4();
  }

  if (verbose) {
    console.log(`* Harvesting SUSHI credentials from ${config.ezmesure.baseUrl}`);
  }

  for (let i = 0; i < sushiItems.length; i += 1) {
    const sushiItem = sushiItems[i];
    const sushiId = sushiItem?.id;
    let task;
    let error;

    if (verbose) {
      console.log(`* Starting harvest for [${sushiItem.vendor}][${sushiId}]`);
    }

    try {
      const { data } = await sushiLib.harvest(sushiId, {
        target,
        beginDate,
        endDate,
        forceDownload: cache === false,
        harvestId,
        reportType,
        ignoreValidation,
      });
      task = data;
    } catch (e) {
      error = formatApiError(e, { prefix: false, colorize: false });
    }

    results.push({ sushiId, task, error });
  }

  if (argv.ndjson) {
    results.forEach((task) => console.log(JSON.stringify(task)));
    process.exit(0);
  }
  if (argv.json) {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  }

  const header = [
    i18n.t('sushi.harvest.sushiId'),
    i18n.t('sushi.harvest.taskId'),
    i18n.t('sushi.harvest.status'),
    i18n.t('sushi.harvest.message'),
  ];

  const lines = results.map(({ sushiId, task, error }) => [
    sushiId || '',
    task?.id || '',
    coloredStatus(error ? 'error' : task?.status),
    error || '',
  ]);

  const taskIds = results.map(({ task }) => task?.id).filter((x) => x);
  const nbFailed = results.filter(({ task, error }) => (error || !task)).length;
  const nbCreated = taskIds.length;

  console.log(table([header, ...lines]));

  if (nbFailed > 0) {
    console.error(chalk.red(i18n.t('sushi.harvest.xFailedTasks', { n: nbFailed })));
  }

  console.log(chalk.green(i18n.t('sushi.harvest.xTasksCreated', { n: nbCreated.toString() })));

  if (nbCreated > 0) {
    console.log();
    console.log(i18n.t('sushi.harvest.runFollowingCommand'));
    console.log(`${scriptName} tasks list --harvestId ${harvestId}`);
  }

  process.exit(0);
};
