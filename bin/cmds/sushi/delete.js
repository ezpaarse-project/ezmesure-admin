const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const { getSushi, deleteSushi } = require('../../../lib/sushi');
const { getAll } = require('../../../lib/institutions');

exports.command = 'delete';
exports.desc = 'Delete a sushi';
exports.builder = {};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  let institutions;
  try {
    const { data } = await getAll(options);
    if (data) { institutions = data; }
  } catch (error) {
    console.error(error);
  }

  if (!institutions) {
    console.log('Institutions not found');
    process.exit(0);
  }

  const institutionsName = institutions.map(({ name }) => name);
  const { institutionSelected } = await inquirer.prompt([{
    type: 'autocomplete',
    pageSize: 20,
    name: 'institutionSelected',
    message: 'Institutions (enter: select institution)',
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
    const { data } = await getSushi(institutionId);
    if (data) { sushi = data; }
  } catch (err) {
    console.error(err);
  }

  const { vendorsSelected } = await inquirer.prompt([{
    type: 'checkbox-plus',
    pageSize: 20,
    name: 'vendorsSelected',
    message: 'Sushi vendor (space to select item)',
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input || '';

      const result = sushi
        .map(({ vendor, id }) => ({ name: vendor, value: id}))
        .filter(({ name }) => name.toLowerCase().includes(input));

      resolve(result);
    }),
  }]);

  if (!vendorsSelected) {
    console.log('No SUSHI\'s credentials found.');
    process.exit(0);
  }

  try {
    await deleteSushi(vendorsSelected);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  console.log('Data removed successfully.');
};
