const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');
const { getAll } = require('../../../lib/institutions');

exports.command = 'list';
exports.desc = i18n.t('institutions.list.description');
exports.builder = function builder(yargs) {};
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
