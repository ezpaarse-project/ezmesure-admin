const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');

const institutionsLib = require('../../../lib/institutions');
const it = require('./interactive/get');

exports.command = 'get [institutions...]';
exports.desc = i18n.t('institutions.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('institutions.get.options.institutions'),
    type: 'string',
  }).option('it', {
    describe: i18n.t('institutions.get.options.interactive'),
    boolean: true,
  }).option('a', {
    alias: 'all',
    describe: i18n.t('institutions.export.get.all'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const { institutions, all } = argv;

  let institutionsData;
  try {
    const { data } = await institutionsLib.findAll();
    institutionsData = data;
  } catch (error) {
    console.error(i18n.t('institutions.institutionsNotFound'));
    process.exit(1);
  }

  if (!all && !institutions.length) {
    try {
      institutionsData = await it(institutionsData);
    } catch (error) {
      console.error(error);
    }
  }

  if (!institutionsData) {
    console.error(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  if (institutions.length && !all) {
    institutionsData = institutionsData.filter(({ name }) => institutions.includes(name));

    if (!institutionsData.length) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: institutions.join(', ') }));
      process.exit(0);
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

  const row = institutionsData.map(({
    name, city, website, domains, auto, validated,
    indexPrefix, role, docContactName, techContactName,
  }) => ([
    name,
    city || '',
    website || '',
    (domains && domains.join(', ')) || '',
    [
      chalk.hex(auto.ezpaarse ? '#78e08f' : '#e55039').bold('ezPAARSE'),
      chalk.hex(auto.ezmesure ? '#78e08f' : '#e55039').bold('ezMESURE'),
      chalk.hex(auto.report ? '#78e08f' : '#e55039').bold('Reporting'),
    ].join('\n'),
    validated ? chalk.hex('#78e08f').bold(i18n.t('institutions.get.validated')) : chalk.hex('#e55039').bold(i18n.t('institutions.get.notValidated')),
    indexPrefix || '',
    role || '',
    [`${i18n.t('institutions.get.doc')} : ${docContactName || '-'}`, `${i18n.t('institutions.get.tech')} : ${techContactName || '-'}`].join('\n'),
  ]));

  console.log(table([header, ...row]));
};
