const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const sushiLib = require('../../../lib/sushi');
const institutionsLib = require('../../../lib/institutions');

exports.command = 'delete';
exports.desc = i18n.t('sushi.delete.description');
exports.builder = function builder() {};
exports.handler = async function handler() {
  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    if (data) { institutions = data; }
  } catch (error) {
    console.error(error);
  }

  if (!institutions) {
    console.log(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  const institutionsName = institutions.map(({ name }) => name);
  const { institutionSelected } = await inquirer.prompt([{
    type: 'autocomplete',
    pageSize: 20,
    name: 'institutionSelected',
    message: i18n.t('institutions.institutionsSelect'),
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input ? input.toLowerCase() : '';

      resolve(institutionsName.filter((indice) => indice.toLowerCase().includes(input)));
    }),
  }]);

  const { id: institutionId } = institutions
    .find(({ name }) => name.toLowerCase() === institutionSelected.toLowerCase());

  let sushi;
  try {
    const { data } = await institutionsLib.getSushi(institutionId);
    if (data) { sushi = data; }
  } catch (err) {
    console.error(err);
  }

  const { vendorsSelected } = await inquirer.prompt([{
    type: 'checkbox-plus',
    pageSize: 20,
    name: 'vendorsSelected',
    message: i18n.t('suhsi.vendorCheckbox'),
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

  if (!vendorsSelected) {
    console.log(i18n.t('sushi.noCredentialsFound'));
    process.exit(0);
  }

  try {
    await sushiLib.delete(vendorsSelected);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(i18n.t('sushi.delete.removed'));
};
