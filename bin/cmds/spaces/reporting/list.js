const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const get = require('lodash.get');
const { table } = require('table');

const spacesLib = require('../../../../lib/spaces');
const { findBySpace } = require('../../../../lib/reporting');
const dashboard = require('../../../../lib/dashboard');

exports.command = 'list [space]';
exports.desc = 'List reporting on space';
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: 'Space name, case sensitive',
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  const { space } = argv;

  let spaceId;
  if (space) {
    try {
      const { data } = await spacesLib.findById(space);
      if (data) { spaceId = data.id; }
    } catch (error) {
      console.log(`space [${space}] not found`);
    }
  }

  if (!space) {
    let spaces;
    try {
      const { data } = await spacesLib.findAll();
      if (data) { spaces = data; }
    } catch (error) {
      console.log(`space [${space}] not found`);
    }

    const { spaceSelected } = await inquirer.prompt([{
      type: 'autocomplete',
      pageSize: 20,
      name: 'spaceSelected',
      message: 'Spaces (enter: select institution)',
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
    console.log(`space [${space}] does not found`);
    process.exit(0);
  }

  let tasks;
  try {
    const { body } = await findBySpace(spaceId);
    if (body) { tasks = get(body, 'hits.hits'); }
  } catch (error) {
    console.log('No reporting tak(s) found');
    process.exit(0);
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
  const rows = tasks.map(({ dashboardName, frequency, emails, print, sentAt }) => ([
    dashboardName,
    frequency,
    emails.join(', '),
    print,
    sentAt,
  ]));

  console.log(table([header, ...rows]));
};
