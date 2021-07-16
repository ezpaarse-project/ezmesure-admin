const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

module.exports = async function it(roles) {
  const { selectedRoles } = await inquirer.prompt([
    {
      type: 'checkbox-plus',
      name: 'selectedRoles',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('roles.roleCheckbox'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = roles
          .map(({ name }) => ({ name, value: name }))
          .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    },
  ]);
  return roles.filter(({ name }) => selectedRoles.includes(name));
};
