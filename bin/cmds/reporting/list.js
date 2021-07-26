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

exports.command = 'list';
exports.desc = i18n.t('reporting.list.description');
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'frequencies',
    describe: i18n.t('reporting.list.options.frequencies'),
    type: 'array',
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

  tasks = tasks.map(({ _id, _source }) => ({ id: _id, ..._source }));

  const dashboards = {};

  for (let i = 0; i < tasks.length; i += 1) {
    const task = tasks[i];
    if (!dashboards[task.space]) {
      try {
        const { data } = await dashboardLib.findAll(task.space);
        dashboards[task.space] = data || [];
      } catch (error) {
        console.error(i18n.t('reporting.list.connotGetDashboards', { space: task.space }));
      }
    }

    if (dashboards[task.space] && dashboards[task.space].length) {
      const dashboard = dashboards[task.space].find(({ type }) => type === 'dashboard');
      tasks[i].dashboardName = dashboard.attributes.title;
    }
  }

  const header = [
    i18n.t('reporting.list.dashboard'),
    i18n.t('reporting.list.frequency'),
    i18n.t('reporting.list.emails'),
    i18n.t('reporting.list.print'),
    i18n.t('reporting.list.sentAt'),
  ];
  const rows = tasks.map(({
    dashboardName, frequency, emails, print, sentAt,
  }) => ([
    dashboardName || '-',
    frequency || '-',
    `${emails.slice(0, 3).join(', ')}, ...`,
    print || '-',
    sentAt || '-',
  ]));

  console.log(table([header, ...rows]));
};
