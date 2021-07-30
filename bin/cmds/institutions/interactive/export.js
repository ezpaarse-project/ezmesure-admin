const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

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
          .map(({ institution }) => ({ name: institution.name, value: institution.id }))
          .filter(({ name }) => (
            name.toLowerCase().includes(input.toLowerCase())
          ));

        resolve(result);
      }),
    },
  ]);

  return institutions.filter(({ institution }) => institutionsSelected.includes(institution.id));
};
