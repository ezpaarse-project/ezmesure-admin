const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');
const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const { getAll } = require('../../../lib/institutions');

exports.command = 'get [institutions...]';
exports.desc = i18n.t('institutions.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('institutions.get.options.institutions'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  let institutions;
  try {
    const { data } = await getAll();
    institutions = data;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  if (!institutions) {
    console.error(i18n.t('institutions.institutionsNotFound'));
  }

  if (argv.institutions.length) {
    institutions = institutions
      .filter((institution) => argv.institutions.includes(institution.name));

    if (!institutions.length) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: argv.institutions.join(', ') }));
      process.exit(0);
    }
  }

  let institutionsId = [];
  if (!argv.institutions.length) {
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
    }
  }

  const header = [
    i18n.t('institutions.name'),
    i18n.t('institutions.city'),
    i18n.t('institutions.website'),
    i18n.t('institutions.domains'),
    i18n.t('institutions.auto'),
    i18n.t('institutions.validate'),
    i18n.t('institutions.indexPrefix'),
    i18n.t('institutions.role'),
    i18n.t('institutions.contact'),
  ];
  const row = institutions.map(({
    name, city, website, domains, auto, validated,
    indexPrefix, role, docContactName, techContactName,
  }) => ([
    name,
    city,
    website,
    domains.join(', '),
    [
      chalk.hex(auto.ezpaarse ? '#78e08f' : '#e55039').bold('ezPAARSE'),
      chalk.hex(auto.ezmesure ? '#78e08f' : '#e55039').bold('ezMESURE'),
      chalk.hex(auto.report ? '#78e08f' : '#e55039').bold('Reporting'),
    ].join('\n'),
    validated ? chalk.hex('#78e08f').bold(i18n.t('institutions.get.validated')) : chalk.hex('#e55039').bold(i18n.t('institutions.get.notValidated')),
    indexPrefix,
    role,
    [`${i18n.t('institutions.get.doc')} : ${docContactName}`, `${i18n.t('institutions.get.tech')} : ${techContactName}`].join('\n'),
  ]));

  console.log(table([header, ...row]));
};
