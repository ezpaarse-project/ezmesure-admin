const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const spacesLib = require('../../../lib/spaces');
const { config } = require('../../../lib/app/config');

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
  const { verbose } = argv;

  if (verbose) {
    console.log(`* Spaces retrieval [${spaces.join(',')}] from ${config.ezmesure.baseUrl}`);
  }

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
      console.log(i18n.t('spaces.notFound'));
      process.exit(0);
    }

    const { selectedSpaces } = await inquirer.prompt([
      {
        type: 'checkbox-plus',
        name: 'selectedSpaces',
        pageSize: 20,
        searchable: true,
        highlight: true,
        message: i18n.t('spaces.spaceCheckbox'),
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
    console.log(i18n.t('spaces.noSpacesSelected'));
    process.exit(0);
  }

  for (let i = 0; i < spaces.length; i += 1) {
    if (verbose) {
      console.log(`* Removal of space [${spaces[i]}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await spacesLib.delete(spaces[i]);
    } catch (error) {
      if (error && error?.response && error?.response?.data) {
        console.log(`[Error#${error.response.data.statusCode}] ${error.response.data.message}`);
      }
    }

    console.log(i18n.t('spaces.delete.removed', { space: spaces[i] }));
  }
};
