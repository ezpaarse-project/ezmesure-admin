const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

exports.selectInstitutions = async (institutions) => inquirer.prompt([{
  type: 'checkbox-plus',
  pageSize: 20,
  name: 'institutionsSelected',
  message: i18n.t('institutions.institutionsCheckbox'),
  searchable: true,
  highlight: true,
  source: (answersSoFar, input) => new Promise((resolve) => {
    input = input ? input.toLowerCase() : '';

    const result = institutions
      .map(({ name, id }) => ({ name, value: id }))
      .filter(({ name }) => name.toLowerCase().includes(input));

    resolve(result);
  }),
}]);
