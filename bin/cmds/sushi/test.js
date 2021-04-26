const fs = require('fs');
const path = require('path');

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

exports.command = 'test [institution]';
exports.desc = 'Test SUSHI informations of institutions';
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: 'Institution name, case sensitive',
    type: 'string',
  })
    .option('token', {
      describe: 'ezMESURE token',
      type: 'string',
    })
    .option('a', {
      alias: 'all',
      describe: 'Test all platforms for once institution',
      type: 'boolean',
    })
    .option('j', {
      alias: 'json',
      describe: 'Print result(s) in json',
      type: 'boolean',
    })
    .option('o', {
      alias: 'output',
      describe: 'Output path',
    });
};
exports.handler = async function handler(argv) {
  let institutionsId = [];

  let institutions = [];

  if (argv.institution) {
    try {
      const { body } = await getInstitution(argv.institution);
      if (body) {
        const data = get(body, 'hits.hits[0]');
        const institution = {
          id: data._id.split(':').pop(),
          ...data._source.institution,
        };
        institutions.push(institution);
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }

    if (!institutions.length) {
      console.log(`Institution [${argv.institution}] not found`);
      process.exit(0);
    }

    institutionsId.push(get(institutions[0], 'id'));
  }

  if (!argv.institution) {
    try {
      const { data } = await getAll();
      if (data) { institutions = data; }
    } catch (error) {
      console.error(error);
    }

    if (!institutions) {
      console.log('No institutions found');
      process.exit(0);
    }

    if (!argv.all) {
      const { institutionsSelected } = await inquirer.prompt([{
        type: 'autocomplete',
        pageSize: 20,
        name: 'institutionsSelected',
        message: 'Institutions (Press <enter> to select institution)',
        searchable: true,
        highlight: true,
        source: (answersSoFar, input) => new Promise((resolve) => {
          input = input ? input.toLowerCase() : '';

          const result = institutions
            .map(({ id, name }) => ({ name, value: id }))
            .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

          resolve(result);
        }),
      }]);

      institutionsId = institutionsSelected;
    }

    if (argv.all) {
      institutionsId = institutions.map(({ id }) => id);
    }
  }

  let credentials = [];
  let sushi = [];

  if (!argv.all) {
    try {
      const { data } = await getSushi(institutionsId);
      if (data) {
        sushi = data;
        credentials = sushi;
      }
    } catch (err) {
      console.error(err);
    }

    const { vendorsSelected } = await inquirer.prompt([{
      type: 'checkbox-plus',
      pageSize: 20,
      name: 'vendorsSelected',
      message: 'Sushi vendor (Press <space> to select item)',
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input || '';

        const result = sushi
          .map(({ id, vendor }) => ({ name: vendor, value: id }))
          .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    }]);

    credentials = sushi.filter(({ id }) => vendorsSelected.includes(id));
  }

  if (!credentials.length && !argv.all) {
    console.log(`No credentials found for ${argv.institution}`);
    process.exit(0);
  }

  if (argv.all) {
    for (let i = 0; i < institutionsId.length; i += 1) {
      try {
        const { data } = await getSushi(institutionsId[i]);
        if (data) {
          sushi = [...sushi, ...data];
          credentials = [...credentials, ...data];
        }
      } catch (err) {
        console.log(err);
        console.log(`No credentials found for ${institutionsId[i]}`);
      }
    }
  }

  const results = [];

  for (let i = 0; i < credentials.length; i += 1) {
    let res;
    try {
      res = await sushiTest(credentials[i]);
    } catch (err) {
      res = JSON.parse(err.message);
    }

    const { name: institution } = institutions
      .find(({ id }) => id === credentials[i].institutionId);

    const result = {
      institution,
      vendor: credentials[i].vendor,
      package: credentials[i].package,
      status: res.status,
      took: res.took,
      message: '',
      url: credentials[i].sushiUrl,
    };

    if (res.error) {
      result.message = Array.isArray(res.error) ? res.error.join(', ') : res.error;
    }

    results.push(result);
  }

  if (!argv.json) {
    const header = ['institution', 'vendor', 'package', 'status', 'duration (ms)', 'message', 'endpoint', 'reports'];
    const lines = results.sort((a, b) => b.status.localeCompare(a.status))
      .map((result) => [
        result.institution,
        result.vendor,
        result.package,
        chalk.hex(result.status === 'error' ? '#e55039' : '#78e08f').bold(result.status),
        result.took || '',
        result.message || '',
        result.url,
        Array.isArray(result.reports) ? result.reports.join(', ') : result.reports,
      ]);
    return console.log(table([header, ...lines]));
  }

  if (argv.json) {
    return console.log(JSON.stringify(results, null, 2));
  }

  if (argv.output) {
    try {
      await fs.writeJson(path.resolve(argv.output, `sushi_test-${new Date().getTime()}.json`), results, { spaces: 2 });
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
};
