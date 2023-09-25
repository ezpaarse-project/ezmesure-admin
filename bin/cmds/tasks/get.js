const { i18n } = global;

const tasksLib = require('../../../lib/tasks');
const { config } = require('../../../lib/app/config');
const { formatApiError, tableDisplay } = require('../../../lib/utils');
const taskFields = require('../../../lib/fields/task');

const displayer = tableDisplay();

exports.command = 'get <taskIds...>';
exports.desc = i18n.t('tasks.get.description');
exports.builder = function builder(yargs) {
  displayer.register(yargs, { availableFields: taskFields.available });

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
  const { verbose, taskIds } = argv;

  let tasks = null;

  if (verbose) {
    console.log(`* Task retrieval [${taskIds}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    const { data } = await tasksLib.getAll({ id: taskIds.join(',') });
    tasks = data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (!Array.isArray(tasks)) {
    console.error(i18n.t('tasks.notFound'));
    process.exit(1);
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
      console.log('* Export task to json format');
    }

    console.log(JSON.stringify(tasks, null, 2));
    process.exit(0);
  }

  if (verbose) {
    console.log('* Display task in graphical form in a table');
  }

  displayer.print(tasks, {
    headerTranslateKey: (field) => `fields.task['${field}']`,
    defaultFields: ['id', 'credentials.endpoint.vendor', 'beginDate', 'status', 'runningTime', 'createdAt'],
    formats: taskFields.format,
  });
};
