/* eslint-disable no-restricted-syntax */
const { i18n } = global;

const { table } = require('table');
const Papa = require('papaparse');
const chalk = require('chalk');

const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');
const rolesLib = require('../../../lib/roles');
const spacesLib = require('../../../lib/spaces');
const itMode = require('./interactive/get');

exports.command = 'check [institutions...]';
exports.desc = i18n.t('institutions.check.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('institutions.get.options.institutions'),
    type: 'string',
  }).option('it', {
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
    })
    .option('c', {
      alias: 'csv',
      describe: i18n.t('institutions.get.options.csv'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    institutions, all, json, ndjson, csv, verbose,
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

  if (!all && !institutions?.length) {
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

  if (institutions?.length) {
    institutionsData = institutionsData
      .filter(({ id, name }) => institutions.includes(name) || institutions.includes(id));
    if (!institutionsData.length) {
      console.log(i18n.t('institutions.institutionsNamesNotFound', { institutions: institutions?.join(', ') }));
      process.exit(0);
    }
  }

  const checkInstitutions = [];

  for await (const institution of institutionsData) {
    const checkInstitution = {
      name: institution.name,
      validated: institution.validated,
      roleInElastic: false,
    };

    if (!institution.docContactName) {
      checkInstitution.docContact = false;
    } else {
      checkInstitution.docContact = institution.docContactName;
    }

    if (!institution.techContactName) {
      checkInstitution.techContact = false;
    } else {
      checkInstitution.techContact = institution.techContactName;
    }

    if (!institution.indexPrefix) {
      checkInstitution.indexPrefix = false;
    } else {
      checkInstitution.indexPrefix = institution.indexPrefix;
    }

    if (!institution.role) {
      checkInstitution.role = false;
    } else {
      checkInstitution.role = institution.role;
    }

    if (!institution.space) {
      checkInstitution.space = false;
    } else {
      checkInstitution.space = institution.space;
    }

    if (!((new Set([institution.indexPrefix, institution.role, institution.space])).size === 1)) {
      checkInstitution.notSparsed = false;
    } else {
      checkInstitution.notSparsed = true;
    }

    const roles = [];
    if (institution.role) {
      try {
        await rolesLib.findByName(institution.role);
        roles.push(institution.role);
      } catch (err) {
        //
      }
      try {
        await rolesLib.findByName(`${institution.role}_read_only`);
        roles.push(`${institution.role}_read_only`);
      } catch (err) {
        //
      }
    }

    if (roles.length >= 1) {
      checkInstitution.roleInElastic = roles;
    }

    if (institution.space) {
      try {
        await spacesLib.findById(institution.space);
        checkInstitution.spaceInElastic = institution.space;
      } catch (err) {
        checkInstitution.spaceInElastic = false;
      }
    } else {
      checkInstitution.spaceInElastic = false;
    }

    checkInstitutions.push(checkInstitution);
  }

  institutionsData = checkInstitutions;

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

  if (csv) {
    if (verbose) {
      console.log('* Export in csv format');
    }

    const csvData = Papa.unparse(institutionsData);

    console.log(csvData);
    process.exit(0);
  }

  const header = [
    i18n.t('institutions.name'),
    i18n.t('institutions.validated'),
    i18n.t('institutions.docContact'),
    i18n.t('institutions.techContact'),
    i18n.t('institutions.indexPrefix'),
    i18n.t('institutions.role'),
    i18n.t('institutions.space'),
    i18n.t('institutions.notSparsed'),
    i18n.t('institutions.roleInElastic'),
    i18n.t('institutions.spaceInElastic'),
  ];

  if (verbose) {
    console.log('* Display institutions in graphical form in a table');
  }

  const row = checkInstitutions.map(({
    name,
    validated,
    docContact,
    techContact,
    indexPrefix,
    role,
    space,
    notSparsed,
    roleInElastic,
    spaceInElastic,
  }) => ([
    name,
    validated ? chalk.hex('#78e08f').bold(validated) : chalk.hex('#e55039').bold(validated),
    docContact ? chalk.hex('#78e08f').bold(docContact) : chalk.hex('#e55039').bold(docContact),
    techContact ? chalk.hex('#78e08f').bold(techContact) : chalk.hex('#e55039').bold(techContact),
    indexPrefix ? chalk.hex('#78e08f').bold(indexPrefix) : chalk.hex('#e55039').bold(indexPrefix),
    role ? chalk.hex('#78e08f').bold(role) : chalk.hex('#e55039').bold(role),
    space ? chalk.hex('#78e08f').bold(space) : chalk.hex('#e55039').bold(space),
    notSparsed ? chalk.hex('#78e08f').bold(notSparsed) : chalk.hex('#e55039').bold(notSparsed),
    roleInElastic ? chalk.hex(roleInElastic?.length === 2 ? '#78e08f' : '#e55039').bold(roleInElastic?.join(',')) : chalk.hex('#e55039').bold(false),
    spaceInElastic ? chalk.hex('#78e08f').bold(spaceInElastic) : chalk.hex('#e55039').bold(spaceInElastic),
  ]));

  console.log(table([header, ...row]));
};
