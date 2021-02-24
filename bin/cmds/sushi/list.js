const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const { table } = require('table');

const { getSushi } = require('../../../lib/sushi');
const { getAll } = require('../../../lib/institutions');

exports.command = 'list';
exports.desc = 'List SUSHI informations of institutions';
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
    console.log('No institutions found');
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

  const vendors = sushi.map(({ vendor }) => vendor);
  const { vendorsSelected } = await inquirer.prompt([{
    type: 'checkbox-plus',
    pageSize: 20,
    name: 'vendorsSelected',
    message: 'Sushi vendor (space to select item)',
    searchable: true,
    highlight: true,
    source: (answersSoFar, input) => new Promise((resolve) => {
      input = input || '';

      resolve(vendors.filter((indice) => indice.toLowerCase().includes(input)));
    }),
  }]);

  const header = ['package', 'vendor', 'endpoint', 'customerId', 'requestorId', 'apiKey', 'comment'];
  const lines = vendorsSelected.map((vendorSelected) => {
    const platform = sushi
      .find(({ vendor }) => vendor.toLowerCase() === vendorSelected.toLowerCase());

    return [
      platform.package,
      platform.vendor,
      platform.sushiUrl,
      platform.customerId,
      platform.requestorId,
      platform.apiKey,
      platform.comment,
    ];
  });
  console.log(table([header, ...lines]));
};
