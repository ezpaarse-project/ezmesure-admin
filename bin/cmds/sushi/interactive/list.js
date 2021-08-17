const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

exports.selectInstitutions = async (institutions) => inquirer.prompt([{
  type: 'autocomplete',
  pageSize: 20,
  name: 'institutionSelected',
  message: i18n.t('institutions.institutionsSelect'),
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

exports.selectVendors = async (sushi) => inquirer.prompt([{
  type: 'checkbox-plus',
  pageSize: 20,
  name: 'vendorsSelected',
  message: i18n.t('sushi.vendorCheckbox'),
  searchable: true,
  highlight: true,
  source: (answersSoFar, input) => new Promise((resolve) => {
    input = input || '';

    const result = sushi
      .map(({ vendor, id }) => ({ name: vendor, value: id }))
      .filter(({ name }) => name.toLowerCase().includes(input));

    resolve(result);
  }),
}]);
