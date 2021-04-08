const path = require('path');
const fs = require('fs-extra');
const Papa = require('papaparse');
const { format } = require('date-fns');

const get = require('lodash.get');

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const { getInstitutions } = require('../../../lib/institutions');
const { getSushi } = require('../../../lib/sushi');

exports.command = 'export [institutions...]';
exports.desc = 'Export sushi data';
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: 'Institution name, case sensitive',
    type: 'string',
  }).option('o', {
    alias: 'output',
    describe: 'Output type : json or csv',
  }).option('a', {
    type: 'boolean',
    alias: 'all',
    describe: 'Export all sushi data for all institutions',
  }).option('d', {
    alias: 'destination',
    describe: 'Destination path',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  const output = argv.output || 'json';

  let institutions;
  try {
    const { body } = await getInstitutions();
    if (body) { institutions = get(body, 'hits.hits'); }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!institutions) {
    console.error('No institutions found');
    process.exit(0);
  }

  institutions = institutions.map(({ _source }) => _source.institution);

  if (argv.institutions && argv.institutions.length) {
    institutions = institutions
      .filter((institution) => argv.institutions.includes(institution.name));

    if (!institutions.length) {
      console.log(`institution(s) [${argv.insitutions.join(', ')}] not found`);
      process.exit(0);
    }
  }

  let institutionsId = [];
  if (!argv.institutions.length && !argv.all) {
    const { ids } = await inquirer.prompt([
      {
        type: 'checkbox-plus',
        name: 'ids',
        pageSize: 20,
        searchable: true,
        highlight: true,
        message: 'Institutions :',
        source: (answersSoFar, input) => new Promise((resolve) => {
          const result = institutions
            .map(({ id, name }) => ({ name, value: id }))
            .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

          resolve(result);
        }),
      },
    ]);
    institutionsId = ids;
  }

  if (institutionsId.length) {
    institutions = institutions.filter(({ id }) => institutionsId.includes(id));

    if (!institutions) {
      console.error('No institutions found');
      process.exit(0);
    }
  }

  for (let i = 0; i < institutions.length; i += 1) {
    let sushi = [];

    try {
      const { data } = await getSushi(institutions[i].id);
      sushi = data;
    } catch (error) {
      console.error(error);
    }

    if (!sushi.length) {
      console.log(`There are no sushi credentials for this institution (${institutions[i].name})`);
    }

    if (sushi.length) {
      const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
      const fileName = `export_sushi_${institutions[i].name.toLowerCase()}_${currentDate}`;

      if (output && output.toLowerCase() === 'json') {
        if (argv.destination) {
          const filePath = path.resolve(argv.destination, `${fileName}.json`);
          try {
            await fs.writeJson(filePath, sushi, { spaces: 2 });
          } catch (error) {
            console.log(error);
          }
          console.log(`Sushi exported successfully, ${filePath}`);
        }

        if (!argv.destination) {
          console.log(JSON.stringify(sushi, null, 2));
        }
      }

      if (output && output.toLowerCase() === 'csv') {
        const fields = ['id', 'vendor', 'sushiUrl', 'requestorId', 'customerId', 'apiKey', 'comment', 'params', 'package', 'insitutionId', 'updatedAt', 'createdAt'];
        const data = [];
        sushi.forEach(({
          id,
          vendor,
          sushiUrl,
          requestorId,
          customerId,
          apiKey,
          comment,
          params,
          package: pkg,
          insitutionId,
          updatedAt,
          createdAt,
        }) => {
          data.push([
            id,
            vendor,
            sushiUrl,
            requestorId,
            customerId,
            apiKey,
            comment,
            params.join(' '),
            pkg,
            insitutionId,
            updatedAt,
            createdAt,
          ]);
        });
        const csv = Papa.unparse({ fields, data });

        if (argv.destination) {
          const filePath = path.resolve(argv.destination, `${fileName}.csv`);
          try {
            await fs.writeFile(filePath, csv);
          } catch (error) {
            console.log(error);
            process.exit(1);
          }
          console.log(`Sushi exported successfully, ${filePath}`);
        }

        if (!argv.destination) {
          console.log(csv);
        }
      }
    }
  }
};
