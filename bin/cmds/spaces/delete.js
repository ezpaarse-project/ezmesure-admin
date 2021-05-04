const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const spacesLib = require('../../../lib/spaces');

exports.command = 'delete [spaces..]';
exports.desc = i18n.t('spaces.delete.description');
exports.builder = function builder(yargs) {
  return yargs.positional('spaces', {
    describe: i18n.t('spaces.delete.option.spaces'),
    type: 'array',
  });
};
exports.handler = async function handler(argv) {
  let { spaces } = argv;

  if (!Array.isArray(spaces)) {
    let spacesList;
    try {
      const { data } = await spacesLib.findAll();
      if (data) { spacesList = data; }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }

    if (!Array.isArray(spacesList) || !spacesList.length) {
      console.log('No space(s) found.');
      process.exit(0);
    }

    const { selectedSpaces } = await inquirer.prompt([
      {
        type: 'checkbox-plus',
        name: 'selectedSpaces',
        pageSize: 20,
        searchable: true,
        highlight: true,
        message: 'Spaces :',
        source: (answersSoFar, input) => new Promise((resolve) => {
          const result = spacesList
            .map(({ id, name }) => ({ name, value: id }))
            .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

          resolve(result);
        }),
      },
    ]);

    spaces = selectedSpaces || [];
  }

  if (!Array.isArray(spaces) || !spaces.length) {
    console.log('No space(s) selected');
    process.exit(0);
  }

  for (let i = 0; i < spaces.length; i += 1) {
    try {
      const response = await spacesLib.delete(spaces[i]);

      if (response && response.status === 204) {
        console.log(`space ${spaces[i]} removed successully`);
      }
    } catch (error) {
      if (error && error?.response && error?.response?.data) {
        console.log(`[Error#${error.response.data.statusCode}] ${error.response.data.message}`);
      }
    }
  }
};
