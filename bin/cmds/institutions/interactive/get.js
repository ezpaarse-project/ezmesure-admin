const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

module.exports = async function it(institutions) {
  const { institutionsSelected } = await inquirer.prompt([
    {
      type: 'checkbox-plus',
      name: 'institutionsSelected',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('institutions.institutionsCheckbox'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = institutions
          .map(({ name, id }) => ({ name, value: id }))
          .filter(({ name }) => (
            name.toLowerCase().includes(input.toLowerCase())
          ));

        resolve(result);
      }),
    },
  ]);

  return institutions.filter(({ id }) => institutionsSelected.includes(id));
};
