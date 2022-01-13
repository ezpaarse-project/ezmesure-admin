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
const { config } = require('../../../lib/app/config');

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

exports.command = 'get <taskId>';
exports.desc = i18n.t('tasks.get.description');
exports.builder = function builder(yargs) {
  return yargs
    .positional('taskId', {
      describe: i18n.t('tasks.get.options.taskId'),
      type: 'string',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('tasks.get.options.json'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { verbose, taskId } = argv;

  let task = null;

  if (verbose) {
    console.log(`* Task retrieval [${taskId}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    const { data } = await tasksLib.findById(taskId);
    task = data;
  } catch (error) {
    const errorMessage = error?.response?.data?.error;
    const status = error?.response?.status;
    const statusMessage = error?.response?.statusMessage;

    console.error(`[${status}] ${errorMessage || statusMessage || error.message}`);

    process.exit(1);
  }

  if (!task) {
    console.error(i18n.t('tasks.notFound'));
    process.exit(1);
  }

  if (argv.json) {
    if (verbose) {
      console.log('* Export task to json format');
    }

    console.log(JSON.stringify(task, null, 2));
    process.exit(0);
  }

  if (verbose) {
    console.log('* Display task in graphical form in a table');
  }

  const header = [
    i18n.t('tasks.get.id'),
    i18n.t('tasks.get.type'),
    i18n.t('tasks.get.status'),
    i18n.t('tasks.get.runningTime'),
    i18n.t('tasks.get.createdAt'),
  ];

  const createdAt = parseDate(task.createdAt);

  const line = [
    task.id || '',
    task.type || '',
    coloredStatus(task.status),
    toDuration(task.runningTime),
    dateIsValid(createdAt) ? formatDate(createdAt, 'Pp') : '',
  ];

  console.log(table([header, line]));
};
