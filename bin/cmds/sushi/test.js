const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const { table } = require('table');
const chalk = require('chalk');

const { getSushi, sushiTest } = require('../../../lib/sushi');
const { getAll } = require('../../../lib/institutions');

exports.command = 'test [institution]';
exports.desc = 'Test SUSHI informations of institutions';
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: 'Institution name, case sensitive',
    type: 'string',
  }).option('a', {
    alias: 'all',
    describe: 'Test all platforms for once institution',
  }).option('v', {
    alias: 'verbose',
    describe: 'Print result(s) in verbose',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  let institutionId;

  if (argv.institution) {

  }

  if (!argv.institution) {
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

        resolve(institutionsName.filter(indice => indice.toLowerCase().includes(input)));
      }),
    }]);

    const { id } = institutions
      .find(({ name }) => name.toLowerCase() === institutionSelected.toLowerCase());
    
    institutionId = id;
  }

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

      resolve(vendors.filter(indice => indice.toLowerCase().includes(input)));
    }),
  }]);

  const credentials = sushi.filter(({ vendor }) => vendorsSelected.includes(vendor));

  const results = [];

  for (let i = 0; i < credentials.length; i += 1) {
    try {
      await sushiTest(credentials[i]);
      results.push({
        vendor: credentials[i].vendor,
        status: 'success',
        url: credentials[i].sushiUrl,
      });
    } catch (error) {
      results.push({
        vendor: credentials[i].vendor,
        status: 'error',
        message: Array.isArray(error) ? error.join(', ') : error,
        url: credentials[i].sushiUrl,
      });
    }
  }

  const header = ['package', 'status', 'message', 'endpoint'];
  const lines = results.sort((a, b) => b.status.localeCompare(a.status))
    .map(result => [
      result.vendor,
      chalk.hex(result.status === 'error' ? '#e55039' : '#78e08f').bold(result.status),
      result.message || '-',
      result.url,
    ]);
  console.log(table([header, ...lines]));
};
