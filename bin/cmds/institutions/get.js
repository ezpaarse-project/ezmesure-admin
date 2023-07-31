const { i18n } = global;

const { table } = require('table');
const chalk = require('chalk');

const logger = require('../../../lib/logger');
const { config } = require('../../../lib/app/config');

const institutionsLib = require('../../../lib/institutions');
const itMode = require('./interactive/get');

exports.command = 'get [institutions...]';
exports.desc = i18n.t('institutions.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('institutions.get.options.institutions'),
    type: 'string',
  })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('institutions.get.options.interactive'),
      boolean: true,
    })
    .option('no-validated', {
      describe: i18n.t('institutions.get.options.noValidated'),
      type: 'boolean',
    })
    .option('no-contact', {
      describe: i18n.t('institutions.get.options.noContact'),
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
    })
    .option('v', {
      alias: 'verbose',
      describe: i18n.t('institutions.get.options.verbose'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    institutions,
    json,
    validated,
    contact,
    ndjson,
    interactive,
    verbose,
  } = argv;

  if (verbose) { logger.setLevel('verbose'); }

  logger.verbose(`Host: ${config.ezmesure.baseUrl}`);

  let institutionsData;
  logger.verbose('Get all institutions');
  try {
    const { data } = await institutionsLib.getAll({ include: 'memberships' });
    institutionsData = data;
  } catch (error) {
    logger.error(`Cannot get all institutions - ${error.response.status}`);
    process.exit(1);
  }

  if (interactive) {
    try {
      institutionsData = await itMode(institutionsData);
    } catch (error) {
      logger.error('Error in interactive mode');
      process.exit(1);
    }
  }

  if (typeof validated === 'boolean') {
    logger.verbose('Filter validated institutions');
    institutionsData = institutionsData.filter((e) => e.validated === validated);
  }

  if (typeof contact === 'boolean') {
    logger.verbose('Filter institution without contact');
    institutionsData = institutionsData.filter((e) => {
      const hasContact = e.docContactName || e.techContactName;
      return contact ? hasContact : !hasContact;
    });
  }

  if (!institutionsData) {
    logger.info('[institutions]: Cannot found institutions');
    process.exit(0);
  }

  if (institutions.length) {
    institutionsData = institutionsData
      .filter(({ id, name }) => institutions.includes(name) || institutions.includes(id));
    if (!institutionsData.length) {
      logger.info(`[institutions]: Cannot found institution [${institutions.join(', ')}]`);
      process.exit(1);
    }
  }

  if (ndjson) {
    logger.verbose('Return ndjson');
    institutionsData.forEach((data) => console.log(JSON.stringify(data)));
    process.exit(0);
  }

  if (json) {
    logger.verbose('Return json');
    console.log(JSON.stringify(institutionsData, null, 2));
    process.exit(0);
  }

  const red = chalk.hex('#e55039').bold;
  const green = chalk.hex('#78e08f').bold;

  const header = [
    i18n.t('institutions.name'),
    i18n.t('institutions.city'),
    i18n.t('institutions.website'),
    i18n.t('institutions.domains'),
    i18n.t('institutions.auto'),
    i18n.t('institutions.validate'),
    i18n.t('institutions.contact'),
  ];

  const getContactsOfInstitution = (institution, role) => {
    const contacts = institution.memberships
      .filter((membership) => membership.roles.includes(role));
    const usernames = contacts.map((c) => c.username);
    return usernames;
  };

  const row = institutionsData.map((institution) => ([
    institution.name,
    institution.city || '',
    institution.website || '',
    (institution.domains && institution.domains.join(', ')) || '',
    [
      (institution.auto?.ezpaarse ? green : red)('ezPAARSE'),
      (institution.auto?.ezmesure ? green : red)('ezMESURE'),
      (institution.auto?.report ? green : red)('reporting'),
    ].join('\n'),
    institution.validate ? green(i18n.t('institutions.get.validated')) : red(i18n.t('institutions.get.notValidated')),
    [`${i18n.t('institutions.get.doc')} : ${getContactsOfInstitution(institution, 'contact:doc') || red('n/a')}`, `${i18n.t('institutions.get.tech')} : ${getContactsOfInstitution(institution, 'contact:tech') || red('n/a')}`].join('\n'),
  ]));

  console.log(table([header, ...row]));
};
