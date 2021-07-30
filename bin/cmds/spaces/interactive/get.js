const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

module.exports = async function it(spaces) {
  const { selectedSpaces } = await inquirer.prompt([
    {
      type: 'checkbox-plus',
      name: 'selectedSpaces',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('spaces.spaceCheckbox'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = spaces
          .map(({ id, name }) => ({ name, value: id }))
          .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    },
  ]);
  return spaces.filter(({ id }) => selectedSpaces.includes(id));
};
