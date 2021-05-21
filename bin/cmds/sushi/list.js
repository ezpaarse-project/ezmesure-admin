const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const { table } = require('table');

const { getSushi } = require('../../../lib/sushi');
const { getAll } = require('../../../lib/institutions');

exports.command = 'list';
exports.desc = i18n.t('sushi.list.description');
exports.builder = function builder(yargs) {};
exports.handler = async function handler(argv) {
  let institutions;
  try {
    const { data } = await getAll();
    if (data) { institutions = data; }
  } catch (error) {
    console.error(error);
  }

  if (!institutions) {
    console.log(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  const { institutionSelected } = await inquirer.prompt([{
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

  let sushi;
  try {
    const { data } = await getSushi(institutionSelected);
    if (data) { sushi = data; }
  } catch (err) {
    console.error(err);
  }

  const { vendorsSelected } = await inquirer.prompt([{
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

  const selectedSushi = sushi.filter(({ id }) => vendorsSelected.includes(id));
  console.log(selectedSushi);

  const header = [
    i18n.t('sushi.list.package'),
    i18n.t('sushi.list.vendor'),
    i18n.t('sushi.list.endpoint'),
    i18n.t('sushi.list.customerId'),
    i18n.t('sushi.list.requestorId'),
    i18n.t('sushi.list.apiKey'),
    i18n.t('sushi.list.comment'),
  ];
  const lines = selectedSushi.map((platform) => ([
    platform.package,
    platform.vendor,
    platform.sushiUrl,
    platform.customerId,
    platform.requestorId,
    platform.apiKey,
    platform.comment,
  ]));
  console.log(table([header, ...lines]));
};
