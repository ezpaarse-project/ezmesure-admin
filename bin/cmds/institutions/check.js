const { i18n } = global;

const { table } = require('table');
const Papa = require('papaparse');
const chalk = require('chalk');

const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');
const rolesLib = require('../../../lib/roles');
const spacesLib = require('../../../lib/spaces');
const itMode = require('./interactive/get');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'check [institutions...]';
exports.desc = i18n.t('institutions.check.description');
exports.builder = function builder(yargs) {
  return yargs.positional('institutions', {
    describe: i18n.t('institutions.check.options.institutions'),
    type: 'string',
  }).option('it', {
    describe: i18n.t('institutions.check.options.interactive'),
    boolean: true,
  })
    .option('j', {
      alias: 'json',
      describe: i18n.t('institutions.check.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('institutions.check.options.ndjson'),
      type: 'boolean',
    })
    .option('c', {
      alias: 'csv',
      describe: i18n.t('institutions.check.options.csv'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const {
    institutions, json, ndjson, csv, verbose, it,
  } = argv;

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutionsData;
  try {
    const { data } = await institutionsLib.getAll();
    institutionsData = data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (it) {
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

  let allRoles;

  try {
    ({ data: allRoles } = await rolesLib.getAll());
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  let allSpaces;

  try {
    ({ data: allSpaces } = await spacesLib.getAll());
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  const checkInstitutions = [];

  for (const institution of institutionsData) {
    const checkInstitution = {
      name: institution.name,
      validated: institution.validated,
      roleInElastic: false,
      ezpaarse: institution.auto.ezpaarse,
      ezmesure: institution.auto.ezmesure,
      report: institution.auto.report,
      docContact: institution.docContactName || false,
      techContact: institution.techContactName || false,
      indexPrefix: institution.indexPrefix || false,
      role: institution.role || false,
      space: institution.space || false,
    };

    let roles = [];

    if (institution.role) {
      roles = allRoles
        .filter((e) => e.name === institution.role || e.name === `${institution.role}_read_only`)
        .map((role) => role?.name);
    }

    if (roles.length >= 1) {
      checkInstitution.roleInElastic = roles;
    }

    if (institution.space) {
      checkInstitution.spaceInElastic = allSpaces.find((e) => e.id === institution.space)?.id;
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
    i18n.t('institutions.roleInElastic'),
    i18n.t('institutions.spaceInElastic'),
    i18n.t('institutions.ezpaarse'),
    i18n.t('institutions.ezmesure'),
    i18n.t('institutions.report'),
  ];

  if (verbose) {
    console.log('* Display institutions in graphical form in a table');
  }

  const red = chalk.hex('#e55039').bold;
  const green = chalk.hex('#78e08f').bold;
  const yellow = chalk.yellow.bold;

  const row = checkInstitutions.map(({
    name,
    validated,
    docContact,
    techContact,
    indexPrefix,
    role,
    space,
    roleInElastic,
    spaceInElastic,
    ezpaarse,
    ezmesure,
    report,
  }) => {
    const hasRoles = roleInElastic?.length > 0;
    const roleColor = roleInElastic?.length >= 2 ? green : yellow;

    return [
      name,
      validated ? green(validated) : red(validated),
      docContact ? green(docContact) : red(docContact),
      techContact ? green(techContact) : red(techContact),
      indexPrefix ? green(indexPrefix) : red(indexPrefix),
      role ? green(role) : red(role),
      space ? green(space) : red(space),
      hasRoles ? roleColor(roleInElastic) : red('n/a'),
      spaceInElastic ? green(spaceInElastic) : red('n/a'),
      ezpaarse ? green(ezpaarse) : red(ezpaarse),
      ezmesure ? green(ezmesure) : red(ezmesure),
      report ? green(report) : red(report),
    ];
  });

  console.log(table([header, ...row]));
};
