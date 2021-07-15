const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const get = require('lodash.get');

const spacesLib = require('../../../../lib/spaces');
const { findBySpace } = require('../../../../lib/reporting');
const dashboard = require('../../../../lib/dashboards');
const reporting = require('../../../../lib/reporting');

exports.command = 'delete [space]';
exports.desc = i18n.t('spaces.reporting.delete.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('spaces.reporting.delete.options.space'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const { space } = argv;

  let spaceId;
  if (space) {
    try {
      const { data } = await spacesLib.getById(space);
      if (data) { spaceId = data.id; }
    } catch (error) {
      console.log(i18n.t('spaces.notFoundSpace', { space }));
    }
  }

  if (!space) {
    let spaces;
    try {
      const { data } = await spacesLib.findAll();
      if (data) { spaces = data; }
    } catch (error) {
      console.log(i18n.t('spaces.notFound'));
    }

    const { spaceSelected } = await inquirer.prompt([{
      type: 'autocomplete',
      pageSize: 20,
      name: 'spaceSelected',
      message: i18n.t('spaces.spaceSelect'),
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input ? input.toLowerCase() : '';

        const result = spaces
          .map(({ id, name }) => ({ name, value: id }))
          .filter(({ name }) => name.toLowerCase().includes(input));

        resolve(result);
      }),
    }]);

    spaceId = spaceSelected;
  }

  if (!spaceId) {
    console.log(i18n.t('spaces.notFoundSpace', { space }));
    process.exit(0);
  }

  let tasks;
  try {
    const { body } = await findBySpace(spaceId);
    if (body) { tasks = get(body, 'hits.hits'); }
  } catch (error) {
    console.log(i18n.t('reporting.noTasksFound'));
    process.exit(0);
  }

  if (!tasks.length) {
    console.log(i18n.t('reporting.noTasksFound'));
    process.exit(0);
  }

  tasks = tasks.map(({ _id, _source }) => ({ id: _id, ..._source }));

  for (let i = 0; i < tasks.length; i += 1) {
    const task = tasks[i];
    try {
      const { body } = await dashboard.findById(task.space, task.dashboardId);
      if (body) {
        tasks[i].dashboardName = body.dashboard.title;
      }
    } catch (error) {
      console.log(i18n.t('spaces.reporting.dashboardNotFound', { dashboardId: `${tasks.space ? `${tasks.space}:` : ''}dashboard:${task.dashboardId}` }));
    }
  }

  const { tasksSelected } = await inquirer.prompt([{
    type: 'checkbox-plus',
    pageSize: 20,
    name: 'tasksSelected',
    message: i18n.t('spaces.spaceCheckbox'),
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input ? input.toLowerCase() : '';

      const result = tasks
        .map(({ id, print, dashboardName }) => ({ name: `${print ? '[OI] ' : ''}${dashboardName}`, value: id }))
        .filter(({ name }) => name.toLowerCase().includes(input));

      resolve(result);
    }),
  }]);

  if (!tasksSelected.length) {
    console.log(i18n.t('reporting.noTaskSelected'));
    process.exit(0);
  }

  try {
    const { body } = await reporting.delete(tasksSelected);
    const items = get(body, 'items');
    for (let i = 0; i < items.length; i += 1) {
      const itemDeleted = items[i].delete;

      if (itemDeleted && itemDeleted.result === 'deleted') {
        const task = tasks.find(({ id }) => id === itemDeleted._id);
        console.log(i18n.t('reporting.deleted', { taskName: `${task.print ? '[OI] ' : ''}${task.dashboardName}` }));
      }

      if (itemDeleted && itemDeleted.result !== 'deleted') {
        console.log(i18n.t('reporting.deletedMessage', { id: itemDeleted._id, result: itemDeleted.result }));
      }
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
