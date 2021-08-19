const { i18n } = global;

const path = require('path');
const fs = require('fs-extra');
const Papa = require('papaparse');
const { format } = require('date-fns');

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const institutionsLib = require('../../../lib/institutions');

exports.command = 'export [institutions...]';
exports.desc = i18n.t('sushi.export.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    descibe: i18n.t('sushi.export.options.institutions'),
    type: 'string',
  }).option('o', {
    alias: 'output',
    descibe: i18n.t('sushi.export.options.output'),
  }).option('a', {
    type: 'boolean',
    alias: 'all',
    descibe: i18n.t('sushi.export.options.all'),
  }).option('d', {
    alias: 'destination',
    descibe: i18n.t('sushi.export.options.destination'),
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  const output = argv.output || 'json';

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    institutions = data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!institutions) {
    console.error(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  institutions = institutions.map(({ _source }) => _source.institution);

  if (argv.institutions && argv.institutions.length) {
    institutions = institutions
      .filter((institution) => argv.institutions.includes(institution.name));

    if (!institutions.length) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: argv.institutions.join(', ') }));
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
        message: i18n.t('institutions.institutionsCheckbox'),
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
      console.error(i18n.t('institutions.institutionsNotFound'));
      process.exit(0);
    }
  }

  for (let i = 0; i < institutions.length; i += 1) {
    let sushi = [];

    try {
      const { data } = await institutionsLib.getSushi(institutions[i].id);
      sushi = data;
    } catch (error) {
      console.error(error);
    }

    if (!sushi.length) {
      console.log(i18n.t('sushi.noCredentialFoundFor', { institution: institutions[i].name }));
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
          console.log(i18n.t('sushi.export.exported', { file: filePath }));
        }

        if (!argv.destination) {
          console.log(JSON.stringify(sushi, null, 2));
        }
      }

      if (output && output.toLowerCase() === 'csv') {
        const fields = [
          i18n.t('sushi.expoirt.id'),
          i18n.t('sushi.expoirt.vendor'),
          i18n.t('sushi.expoirt.sushiUrl'),
          i18n.t('sushi.expoirt.requestorId'),
          i18n.t('sushi.expoirt.customerId'),
          i18n.t('sushi.expoirt.apiKey'),
          i18n.t('sushi.expoirt.comment'),
          i18n.t('sushi.expoirt.params'),
          i18n.t('sushi.expoirt.package'),
          i18n.t('sushi.expoirt.insitutionId'),
          i18n.t('sushi.expoirt.updatedAt'),
          i18n.t('sushi.expoirt.createdAt'),
        ];
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
          console.log(i18n.t('sushi.export.exported', { file: filePath }));
        }

        if (!argv.destination) {
          console.log(csv);
        }
      }
    }
  }
};
