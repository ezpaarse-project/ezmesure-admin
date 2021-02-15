const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const { table } = require('table');
const chalk = require('chalk');

const get = require('lodash.get');

const { getSushi, sushiTest } = require('../../../lib/sushi');
const { getAll, getInstitution } = require('../../../lib/institutions');
const { stringify } = require('uuid');

exports.command = 'test [institution]';
exports.desc = 'Test SUSHI informations of institutions';
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: 'Institution name, case sensitive',
    type: 'string',
  }).option('a', {
    alias: 'all',
    describe: 'Test all platforms for once institution',
  }).option('j', {
    alias: 'json',
    describe: 'Print result(s) in json',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  let institutionsId = [];

  if (argv.institution) {
    let institution;
    try {
      const { body } = await getInstitution(argv.institution);
      if (body) { institution = get(body, 'hits.hits[0]'); }
    } catch (error) {
      console.error(error);
    }

    if (!institution) {
      console.log(`Institution [${argv.institution}] not found`);
      process.exit(0);
    }

    institutionsId.push(get(institution, '_source.institution.id'));
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

    if (!argv.all) {
      const institutionsName = institutions.map(({ name }) => name);
      const { institutionSelected } = await inquirer.prompt([{
        type: 'autocomplete',
        pageSize: 20,
        name: 'institutionSelected',
        message: 'Institutions (Press <enter> to select institution)',
        searchable: true,
        highlight: true,
        source: (answersSoFar, input) => new Promise((resolve) => {
          input = input ? input.toLowerCase() : '';

          resolve(institutionsName.filter(indice => indice.toLowerCase().includes(input)));
        }),
      }]);

      const { id } = institutions
        .find(({ name }) => name.toLowerCase() === institutionSelected.toLowerCase());
      
      institutionsId.push(id);
    }

    if (argv.all) {
      institutionsId = institutions.map(({ id }) => id);
    }
  }

  let credentials
  let sushi;
  try {
    const { data } = await getSushi(institutionsId);
    if (data) {
      sushi = data;
      credentials = sushi;
    }
  } catch (err) {
    console.error(err);
  }

  if (!argv.all) {
    const vendors = sushi.map(({ vendor }) => vendor);
    const { vendorsSelected } = await inquirer.prompt([{
      type: 'checkbox-plus',
      pageSize: 20,
      name: 'vendorsSelected',
      message: 'Sushi vendor (Press <space> to select item)',
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input || '';

        resolve(vendors.filter(indice => indice.toLowerCase().includes(input)));
      }),
    }]);

    credentials = sushi.filter(({ vendor }) => vendorsSelected.includes(vendor));
  }

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

  if (!argv.json) {
    const header = ['package', 'status', 'message', 'endpoint'];
    const lines = results.sort((a, b) => b.status.localeCompare(a.status))
      .map(result => [
        result.vendor,
        chalk.hex(result.status === 'error' ? '#e55039' : '#78e08f').bold(result.status),
        result.message || '-',
        result.url,
      ]);
    return console.log(table([header, ...lines]));
  }

  return console.log(JSON.stringify(results, null, 2));
};
