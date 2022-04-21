const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');

const tasksLib = require('../../../lib/tasks');
const { formatApiError } = require('../../../lib/utils');

const coloredStatus = (status = '') => {
  if (status === 'running') { return chalk.blue(status); }
  if (status === 'cancelled') { return chalk.yellow(status); }
  if (status === 'interrupted') { return chalk.red(status); }
  if (status === 'error') { return chalk.red(status); }
  if (status === 'finished') { return chalk.green(status); }
  return chalk.white(status);
};

exports.command = 'cancel';
exports.desc = i18n.t('tasks.cancel.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('f', {
      alias: 'force',
      describe: i18n.t('tasks.cancel.options.force'),
      type: 'boolean',
    })
    .option('u', {
      alias: 'status',
      describe: i18n.t('tasks.cancel.options.status'),
      type: 'string',
    })
    .option('t', {
      alias: 'type',
      describe: i18n.t('tasks.cancel.options.type'),
      type: 'string',
    })
    .option('id', {
      type: 'string',
      describe: i18n.t('tasks.cancel.options.id'),
    })
    .option('harvestId', {
      alias: 'hid',
      type: 'string',
      describe: i18n.t('tasks.cancel.options.harvestId'),
    })
    .option('s', {
      alias: 'sushiId',
      describe: i18n.t('tasks.cancel.options.sushiId'),
      type: 'string',
    })
    .option('i', {
      alias: 'institutionId',
      describe: i18n.t('tasks.cancel.options.institutionId'),
      type: 'string',
    })
    .option('e', {
      alias: 'endpointId',
      describe: i18n.t('tasks.cancel.options.endpointId'),
      type: 'string',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('tasks.cancel.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('tasks.cancel.options.ndjson'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const params = {};
  let tasks;

  if (argv.status) { params.status = argv.status; }
  if (argv.type) { params.type = argv.type; }
  if (argv.id) { params.id = argv.id; }
  if (argv.harvestId) { params.harvestId = argv.harvestId; }
  if (argv.sushiId) { params.sushiId = argv.sushiId; }
  if (argv.institutionId) { params.institutionId = argv.institutionId; }
  if (argv.endpointId) { params.endpointId = argv.endpointId; }
  if (argv.collapse) { params.collapse = argv.collapse; }

  if (Object.keys(params).length === 0 && !argv.all) {
    console.error(i18n.t('tasks.cancel.pleaseSetAllFlag'));
    process.exit(1);
  }

  try {
    ({ data: tasks } = await tasksLib.getAll(params));
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.log(i18n.t('tasks.noTasks'));
    process.exit(0);
  }

  let nbCancelled = 0;
  let nbFailed = 0;
  const results = [];

  for (let i = 0; i < tasks.length; i += 1) {
    const task = tasks[i];
    let error;
    let updatedTask;

    if (argv.force || task?.status === 'waiting') {
      try {
        ({ data: updatedTask } = await tasksLib.cancel(task.id));

        if (updatedTask?.status === 'cancelled' && (updatedTask?.status !== task?.status)) {
          nbCancelled += 1;
        }
      } catch (e) {
        nbFailed += 1;
        error = e;
      }
    }

    results.push({ task: (updatedTask || task), error });
  }

  if (argv.ndjson) {
    results.forEach((result) => console.log(JSON.stringify(result)));
    process.exit(0);
  }

  if (argv.json) {
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  }

  const header = [
    i18n.t('tasks.get.id'),
    i18n.t('tasks.get.type'),
    i18n.t('tasks.get.status'),
    i18n.t('tasks.get.error'),
  ];

  const lines = results.map(({ task, error }) => [
    task.id || '',
    task.type || '',
    coloredStatus(task.status),
    error ? formatApiError(error) : '',
  ]);

  console.log(table([header, ...lines]));

  if (nbFailed > 0) {
    console.error(chalk.red(i18n.t('tasks.cancel.nbFailed', { n: nbFailed })));
  }

  console.log(i18n.t('tasks.cancel.nbCancelled', { n: nbCancelled.toString() }));
};
