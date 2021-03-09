const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const get = require('lodash.get');
const { table } = require('table');

const spacesLib = require('../../../../lib/spaces');
const { findBySpace } = require('../../../../lib/reporting');

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

  const header = ['DashboardId', 'Frequency', 'Emails', 'Print', 'Sent at'];
  const rows = tasks.map(({ _source }) => ([
    _source.dashboardId,
    _source.frequency,
    _source.emails.join(', '),
    _source.print,
    _source.sentAt,
  ]));

  console.log(table([header, ...rows]));
};
