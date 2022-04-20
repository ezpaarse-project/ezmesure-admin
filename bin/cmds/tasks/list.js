const { i18n } = global;

const tasksLib = require('../../../lib/tasks');
const { formatApiError, tableDisplay } = require('../../../lib/utils');
const taskFields = require('../../../lib/fields/task');

const displayer = tableDisplay();

exports.command = 'list';
exports.desc = i18n.t('tasks.list.description');
exports.builder = function builder(yargs) {
  displayer.register(yargs, { availableFields: taskFields.available });

  return yargs
    .option('u', {
      alias: 'status',
      describe: i18n.t('tasks.list.options.status'),
      type: 'string',
    })
    .option('size', {
      describe: i18n.t('tasks.list.options.size'),
      type: 'number',
    })
    .option('t', {
      alias: 'type',
      describe: i18n.t('tasks.list.options.type'),
      type: 'string',
    })
    .option('id', {
      type: 'string',
      describe: i18n.t('tasks.list.options.id'),
    })
    .option('harvestId', {
      alias: 'hid',
      type: 'string',
      describe: i18n.t('tasks.list.options.harvestId'),
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

  if (argv.size) { params.size = argv.size; }
  if (argv.status) { params.status = argv.status; }
  if (argv.type) { params.type = argv.type; }
  if (argv.id) { params.id = argv.id; }
  if (argv.harvestId) { params.harvestId = argv.harvestId; }
  if (argv.sushiId) { params.sushiId = argv.sushiId; }
  if (argv.institutionId) { params.institutionId = argv.institutionId; }
  if (argv.endpointId) { params.endpointId = argv.endpointId; }
  if (argv.collapse) { params.collapse = argv.collapse; }

  try {
    const { data } = await tasksLib.getAll(params);
    tasks = data;
  } catch (error) {
    console.error(formatApiError(error));
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

  displayer.print(tasks, {
    headerTranslateKey: (field) => `fields.task['${field}']`,
    defaultFields: ['id', 'type', 'status', 'runningTime', 'createdAt'],
    formats: taskFields.format,
  });
};
