const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');
const spacesLib = require('../../../../lib/spaces');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

module.exports = async function it() {
  let spaces;
  try {
    const { data } = await spacesLib.findAll();
    spaces = data;
  } catch (error) {
    console.error(error);
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
  const spaceId = spaceSelected === 'default' ? null : spaceSelected;

  return { spaceId };
};
