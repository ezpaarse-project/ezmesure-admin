const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');

const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');
const itMode = require('./interactive/get');

exports.command = 'get [institutions...]';
exports.desc = i18n.t('institutions.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('institutions.get.options.institutions'),
    type: 'string',
  })
    .option('it', {
      describe: i18n.t('institutions.get.options.interactive'),
      boolean: true,
    })
    .option('a', {
      alias: 'all',
      describe: i18n.t('institutions.get.options.all'),
      type: 'boolean',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('institutions.get.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('institutions.get.options.ndjson'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    institutions, all, json, ndjson, verbose,
  } = argv;

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutionsData;
  try {
    const { data } = await institutionsLib.getAll();
    institutionsData = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  if (!all && !institutions.length) {
    try {
      institutionsData = await itMode(institutionsData);
    } catch (error) {
      console.error(error);
    }
  }

  if (!institutionsData) {
    console.error(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  if (institutions.length && !all) {
    institutionsData = institutionsData
      .filter(({ id, name }) => institutions.includes(name) || institutions.includes(id));

    if (!institutionsData.length) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: institutions.join(', ') }));
      process.exit(0);
    }
  }

  if (ndjson) {
    if (verbose) {
      console.log('* Export in ndjson format');
    }

    institutionsData.forEach((data) => console.log(JSON.stringify(data)));
    process.exit(0);
  }

  if (json) {
    if (verbose) {
      console.log('* Export in json format');
    }

    console.log(JSON.stringify(institutionsData, null, 2));
    process.exit(0);
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

  if (verbose) {
    console.log('* Display institutions in graphical form in a table');
  }

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
