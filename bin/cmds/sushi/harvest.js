const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');

const sushiLib = require('../../../lib/sushi');
const endpointsLib = require('../../../lib/endpoints');
const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');

const coloredStatus = (status = '') => {
  if (status === 'running') { return chalk.blue(status); }
  if (status === 'interrupted') { return chalk.red(status); }
  if (status === 'error') { return chalk.red(status); }
  if (status === 'finished') { return chalk.green(status); }
  return chalk.white(status);
};

exports.command = 'harvest [sushiIds...]';
exports.desc = i18n.t('sushi.harvest.description');
exports.builder = function builder(yargs) {
  return yargs
    .positional('sushiIds', {
      describe: i18n.t('sushi.harvest.options.sushiIds'),
      type: 'string',
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
    .option('from-institution', {
      type: 'string',
      describe: i18n.t('sushi.harvest.options.fromInstitution'),
    })
    .option('with-tags', {
      type: 'string',
      describe: i18n.t('sushi.harvest.options.withTags'),
    })
    .option('allow-faulty', {
      type: 'boolean',
      describe: i18n.t('sushi.harvest.options.allowFaulty'),
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
    target,
    from: beginDate,
    to: endDate,
    cache,
    verbose,
    fromInstitution,
    withTags,
    allowFaulty,
    $0: scriptName,
  } = argv;

  let { sushiIds } = argv;

  const results = [];
  let endpointIds;

  if (withTags) {
    const tags = withTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((x) => x)
      .join(',');

    console.log(`* Fetch SUSHI endpoints having tags [${tags}] from ${config.ezmesure.baseUrl}`);

    try {
      const { data: endpoints } = await endpointsLib.getAll({ tags });

      if (Array.isArray(endpoints)) {
        endpointIds = new Set(endpoints.map((e) => e?.id));
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.error;
      const status = e?.response?.status;
      const statusMessage = e?.response?.statusMessage;

      console.error(`[${status}] ${errorMessage || statusMessage || e.message}`);
      process.exit(1);
    }
  }

  if (fromInstitution) {
    console.log(`* Fetch SUSHI credentials of institution [${fromInstitution}] from ${config.ezmesure.baseUrl}`);

    try {
      const { data } = await institutionsLib.getSushi(fromInstitution);
      if (Array.isArray(data)) {
        sushiIds = data
          .filter((item) => {
            if (item?.connection?.success !== true && !allowFaulty) {
              return false;
            }
            if (endpointIds && !endpointIds.has(item.endpointId)) {
              return false;
            }
            return item.id;
          })
          .map((item) => item?.id);
      }
    } catch (e) {
      const errorMessage = e?.response?.data?.error;
      const status = e?.response?.status;
      const statusMessage = e?.response?.statusMessage;

      console.error(`[${status}] ${errorMessage || statusMessage || e.message}`);
      process.exit(1);
    }
  }

  if (verbose) {
    console.log(`* Harvesting SUSHI credentials from ${config.ezmesure.baseUrl}`);
  }

  for (let i = 0; i < sushiIds.length; i += 1) {
    const sushiId = sushiIds[i];
    let task;
    let error;

    if (verbose) {
      console.log(`* Starting harvest for [${sushiId}]`);
    }

    try {
      const { data } = await sushiLib.harvest(sushiId, {
        target,
        beginDate,
        endDate,
        forceDownload: cache === false,
      });
      task = data;
    } catch (e) {
      const errorMessage = e?.response?.data?.error;
      const status = e?.response?.status;
      const statusMessage = e?.response?.statusMessage;

      error = `[${status}] ${errorMessage || statusMessage || e.message}`;
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

    if (fromInstitution) {
      console.log(`${scriptName} tasks list -i ${fromInstitution} -c params.sushiId`);
    } else {
      console.log(`${scriptName} tasks get ${taskIds.join(' ')}`);
    }
  }

  process.exit(0);
};
