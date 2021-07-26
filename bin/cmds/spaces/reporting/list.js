const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const get = require('lodash.get');
const { table } = require('table');

const spacesLib = require('../../../../lib/spaces');
const reportingLib = require('../../../../lib/reporting');
const dashboardLib = require('../../../../lib/dashboards');

exports.command = 'list [space]';
exports.desc = i18n.t('spaces.reporting.list.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('spaces.reporting.list.options.space'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const { space } = argv;

  let dashboards;
  try {
    const { data } = await dashboardLib.findAll(space);
    dashboards = data;
  } catch (error) {
    console.error(error);
  }

  let spaceId;
  if (space) {
    try {
      const { data } = await spacesLib.findById(space);
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
    const { body } = await reportingLib.findBySpace(spaceId);
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
      tasks[i].dashboardName = dashboards.find(({ id }) => id === task.dashboardId)
        .attributes.title;
    } catch (error) {
      console.log(i18n.t('spaces.reporting.dashboardNotFound', { dashboardId: `${tasks.space ? `${tasks.space}:` : ''}dashboard:${task.dashboardId}` }));
    }
  }

  const header = [
    i18n.t('spaces.reporting.list.dashboard'),
    i18n.t('spaces.reporting.list.frequency'),
    i18n.t('spaces.reporting.list.emails'),
    i18n.t('spaces.reporting.list.print'),
    i18n.t('spaces.reporting.list.sentAt'),
  ];
  const rows = tasks.map(({
    dashboardName, frequency, emails, print, sentAt,
  }) => ([
    dashboardName || '-',
    frequency || '-',
    `${emails.slice(0, 3).join(', ')}, ...`,
    print,
    sentAt || '-',
  ]));

  console.log(table([header, ...rows]));
};
