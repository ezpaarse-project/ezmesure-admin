const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');
const {
  format: formatDate,
  parseISO: parseDate,
  isValid: dateIsValid,
  formatDuration,
} = require('date-fns');

const tasksLib = require('../../../lib/tasks');

const coloredStatus = (status = '') => {
  if (status === 'running') { return chalk.blue(status); }
  if (status === 'interrupted') { return chalk.red(status); }
  if (status === 'error') { return chalk.red(status); }
  if (status === 'finished') { return chalk.green(status); }
  return chalk.white(status);
};

const toDuration = (str) => {
  const runningTime = Number.parseInt(str, 10);

  if (Number.isInteger(runningTime)) {
    return formatDuration({ seconds: runningTime / 1000 });
  }

  return '';
};

exports.command = 'list';
exports.desc = i18n.t('tasks.list.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('u', {
      alias: 'status',
      describe: i18n.t('tasks.list.options.status'),
      type: 'string',
    })
    .option('t', {
      alias: 'type',
      describe: i18n.t('tasks.list.options.type'),
      type: 'string',
    })
    .option('s', {
      alias: 'sushiId',
      describe: i18n.t('tasks.list.options.sushiId'),
      type: 'string',
    })
    .option('i', {
      alias: 'institutionId',
      describe: i18n.t('tasks.list.options.institutionId'),
      type: 'string',
    })
    .option('e', {
      alias: 'endpointId',
      describe: i18n.t('tasks.list.options.endpointId'),
      type: 'string',
    })
    .option('c', {
      alias: 'collapse',
      describe: i18n.t('tasks.list.options.collapse'),
      type: 'string',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('tasks.list.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('tasks.list.options.ndjson'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { verbose } = argv;
  const params = {};
  let tasks;

  if (argv.status) { params.status = argv.status; }
  if (argv.type) { params.type = argv.type; }
  if (argv.sushiId) { params.sushiId = argv.sushiId; }
  if (argv.institutionId) { params.institutionId = argv.institutionId; }
  if (argv.endpointId) { params.endpointId = argv.endpointId; }
  if (argv.collapse) { params.collapse = argv.collapse; }

  try {
    const { data } = await tasksLib.getAll(params);
    tasks = data;
  } catch (error) {
    const errorMessage = error?.response?.data?.error;
    const status = error?.response?.status;
    const statusMessage = error?.response?.statusMessage;

    console.error(`[${status}] ${errorMessage || statusMessage || error.message}`);
    process.exit(1);
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    console.log(i18n.t('tasks.noTasks'));
    process.exit(0);
  }

  if (argv.ndjson) {
    if (verbose) {
      console.log('* Export tasks to ndjson format');
    }

    tasks.forEach((task) => console.log(JSON.stringify(task)));
    process.exit(0);
  }

  if (argv.json) {
    if (verbose) {
      console.log('* Export tasks to json format');
    }

    console.log(JSON.stringify(tasks, null, 2));
    process.exit(0);
  }

  if (verbose) {
    console.log('* Display tasks in graphical form in a table');
  }

  const header = [
    i18n.t('tasks.get.id'),
    i18n.t('tasks.get.type'),
    i18n.t('tasks.get.status'),
    i18n.t('tasks.get.runningTime'),
    i18n.t('tasks.get.createdAt'),
  ];

  const lines = tasks.map((task) => {
    const createdAt = parseDate(task.createdAt);

    return [
      task.id || '',
      task.type || '',
      coloredStatus(task.status),
      toDuration(task.runningTime),
      dateIsValid(createdAt) ? formatDate(createdAt, 'Pp') : '',
    ];
  });

  console.log(table([header, ...lines]));
};
