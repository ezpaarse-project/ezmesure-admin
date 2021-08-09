const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const { format } = require('date-fns');

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
exports.desc = i18n.t('sushi.test.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institution', {
    describe: i18n.t('sushi.test.options.institution'),
    type: 'string',
  })
    .option('a', {
      alias: 'all',
      describe: i18n.t('sushi.test.options.all'),
      type: 'boolean',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('sushi.test.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('sushi.test.options.ndjson'),
      type: 'boolean',
    })
    .option('o', {
      alias: 'output',
      describe: i18n.t('sushi.test.options.output'),
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
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: argv.institution }));
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
      console.log(i18n.t('institutions.institutionsNotFound'));
      process.exit(0);
    }

    if (!argv.all) {
      const { institutionsSelected } = await inquirer.prompt([{
        type: 'autocomplete',
        pageSize: 20,
        name: 'institutionsSelected',
        message: i18n.t('institutions.institutionsSelect'),
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
      message: i18n.t('sushi.vendorCheckbox'),
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
    console.log(i18n.t('sushi.noCredentialsFoundFor', { institution: argv.institution }));
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
        console.log(i18n.t('sushi.noCredentialsFoundFor', { institution: institutionsId[i] }));
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
      reports: res.reports || [],
    };

    if (res.error) {
      result.message = Array.isArray(res.error) ? res.error.join(', ') : res.error;
    }

    results.push(result);
  }

  if (argv.ndjson) {
    if (argv.output) {
      const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
      const filePath = path.resolve(argv.output, `sushis_test_${currentDate}.json`);

      const writeStream = fs.createWriteStream(filePath);
      results.forEach((result) => writeStream.write(`${result}\r\n`));
      writeStream.close();

      console.log(`File exported to : ${filePath}`);
      process.exit(0);
    }

    results.forEach((result) => console.log(JSON.stringify(result)));
    process.exit(0);
  }

  if (argv.json) {
    if (argv.output) {
      try {
        const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
        const filePath = path.resolve(argv.output, `sushis_test_${currentDate}.json`);
        await fs.writeJson(filePath, results, { spaces: 2 });
        return console.log(`File exported to : ${filePath}`);
      } catch (error) {
        console.log(error);
        process.exit(1);
      }
    }

    return console.log(JSON.stringify(results, null, 2));
  }

  const header = [
    i18n.t('sushi.test.institution'),
    i18n.t('sushi.test.vendor'),
    i18n.t('sushi.test.package'),
    i18n.t('sushi.test.status'),
    i18n.t('sushi.test.duration'),
    i18n.t('sushi.test.message'),
    i18n.t('sushi.test.endpoint'),
    i18n.t('sushi.test.reports'),
  ];
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
};
