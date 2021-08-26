const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

module.exports = async function it(users) {
  const { usersSelected } = await inquirer.prompt([
    {
      type: 'checkbox-plus',
      name: 'usersSelected',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('users.get.checkboxLabel'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = users
          .map(({ full_name: name, username }) => ({ name, value: username }))
          .filter(({ name }) => (
            name?.toLowerCase().includes(input?.toLowerCase())
          ));
        resolve(result);
      }),
    },
  ]);

  return users.filter(({ username }) => usersSelected.includes(username));
};
