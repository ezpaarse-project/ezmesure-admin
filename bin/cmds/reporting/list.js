const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const get = require('lodash.get');
const { table } = require('table');

const { findAll, findByFrequency } = require('../../../lib/reporting');
const dashboard = require('../../../lib/dashboard');

exports.command = 'list';
exports.desc = 'List all reporting tasks';
exports.builder = function builder(yargs) {
  return yargs.option('f', {
    alias: 'frequencies',
    describe: 'Report frequency (weekly, monthly, quarterly, semi-annual, annual)',
    type: 'array',
  });
};

exports.handler = async function handler(argv) {
  let tasks;

  if (argv.frequencies.length) {
    try {
      const { body } = await findByFrequency(argv.frequencies);
      if (body) { tasks = get(body, 'hits.hits'); }
    } catch (error) {
      console.log('No reporting tak(s) found');
      process.exit(0);
    }
  }

  if (!argv.frequencies.length) {
    try {
      const { body } = await findAll();
      if (body) { tasks = get(body, 'hits.hits'); }
    } catch (error) {
      console.log('No reporting tak(s) found');
      process.exit(0);
    }
  }

  if (!tasks.length) {
    console.log('No reporting tak(s) found');
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
      console.log(`dashboard [${tasks.space ? `${tasks.space}:` : ''}dashboard:${task.dashboardId}] does not found`);
    }
  }

  const header = ['Dashboard', 'Frequency', 'Emails', 'Print', 'Sent at'];
  const rows = tasks.map(({
    dashboardName, frequency, emails, print, sentAt,
  }) => ([
    dashboardName,
    frequency,
    `${emails.slice(0, 3).join(', ')}, ...`,
    print,
    sentAt,
  ]));

  console.log(table([header, ...rows]));
};
