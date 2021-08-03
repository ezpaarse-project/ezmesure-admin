const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const get = require('lodash.get');
const { table } = require('table');

const reportingLib = require('../../../lib/reporting');
const dashboardLib = require('../../../lib/dashboards');

exports.command = 'list [spaces...]';
exports.desc = i18n.t('reporting.list.description');
exports.builder = function builder(yargs) {
  return yargs.positional('spaces', {
    alias: 'status',
    describe: i18n.t('reporting.list.options.spaces'),
    type: 'array',
  }).option('f', {
    alias: 'frequencies',
    describe: i18n.t('reporting.list.options.frequencies'),
    type: 'array',
  }).option('j', {
    alias: 'json',
    describe: i18n.t('reporting.list.options.json'),
    type: 'boolean',
  });
};

exports.handler = async function handler(argv) {
  let tasks;

  if (argv.frequencies && argv.frequencies.length) {
    try {
      const { body } = await reportingLib.findByFrequency(argv.frequencies);
      if (body) { tasks = get(body, 'hits.hits'); }
    } catch (error) {
      console.log(i18n.t('reporting.noTasksFound'));
      process.exit(0);
    }
  }

  if (!argv.frequencies || !argv.frequencies.length) {
    try {
      const { body } = await reportingLib.findAll();
      if (body) { tasks = get(body, 'hits.hits'); }
    } catch (error) {
      console.log(i18n.t('reporting.noTasksFound'));
      process.exit(0);
    }
  }

  if (!tasks.length) {
    console.log(i18n.t('reporting.noTasksFound'));
    process.exit(0);
  }

  if (argv.spaces && argv.spaces.length) {
    tasks = tasks.filter((task) => argv.spaces.includes(task?._source?.space));
  }

  tasks = tasks.map(({ _id, _source }) => ({ id: _id, ..._source }));

  const dashboards = {};

  for (let i = 0; i < tasks.length; i += 1) {
    const task = tasks[i];
    if (!dashboards[task.space]) {
      try {
        const { data } = await dashboardLib.findAll(task.space);
        dashboards[task.space] = data || [];
      } catch (error) {
        console.error(i18n.t('reporting.cannotGetDashboards', { space: task.space }));
      }
    }

    if (dashboards[task.space] && dashboards[task.space].length) {
      const dashboard = dashboards[task.space].find(({ type, id }) => (type === 'dashboard' && id === task.dashboardId));
      tasks[i].dashboardName = dashboard?.attributes?.title;
    }
  }

  if (argv.json) {
    console.log(JSON.stringify(tasks, null, 2));
    process.exit(0);
  }

  const header = [
    i18n.t('reporting.list.id'),
    i18n.t('reporting.list.space'),
    i18n.t('reporting.list.dashboard'),
    i18n.t('reporting.list.frequency'),
    i18n.t('reporting.list.emails'),
    i18n.t('reporting.list.print'),
    i18n.t('reporting.list.sentAt'),
  ];

  const rows = tasks
    .sort((a, b) => (a.space.localeCompare(b.space)))
    .map(({
      id, space, dashboardName, frequency, emails, print, sentAt,
    }) => ([
      id,
      space || '',
      dashboardName || '-',
      frequency || '-',
      `${emails.slice(0, 3).join(', ')}, ...`,
      print,
      sentAt || '-',
    ]));

  console.log(table([header, ...rows]));
};
