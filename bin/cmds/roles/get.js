const { i18n } = global;

const { table } = require('table');
const rolesLib = require('../../../lib/roles');
const { config } = require('../../../lib/app/config');
const it = require('./interactive/get');

exports.command = 'get [roles...]';
exports.desc = i18n.t('roles.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('roles', {
    describe: i18n.t('roles.get.options.roles'),
    type: 'array',
  })
    .option('a', {
      alias: 'all',
      describe: i18n.t('roles.get.options.all'),
      type: 'boolean',
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('roles.get.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('roles.get.options.ndjson'),
      type: 'boolean',
    })
    .option('it', {
      describe: i18n.t('roles.get.options.interactive'),
      boolean: true,
    });
};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  let roles = [];

  if (verbose) {
    console.log(`* Retrieving roles from ${config.ezmesure.baseUrl}`);
  }

  try {
    const { data } = await rolesLib.findAll(true);
    roles = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  if (!argv.all && argv.roles.length) {
    roles = roles.filter(({ name }) => argv.roles.includes(name));
  }

  if (!argv.all && argv.it) {
    try {
      roles = await it(roles);
    } catch (error) {
      console.error(error);
    }
  }

  if (!roles.length) {
    console.log(i18n.t('roles.rolesNotFound'));
    process.exit(0);
  }

  if (argv && argv.ndjson) {
    if (verbose) {
      console.log('* Display roles data in ndjson format');
    }

    roles.forEach((role) => console.log(JSON.stringify(role)));
    process.exit(0);
  }

  if (argv && argv.json) {
    if (verbose) {
      console.log('* Display roles data in json format');
    }

    console.log(JSON.stringify(roles, null, 2));
    process.exit(0);
  }

  if (verbose) {
    console.log('* Display roles in graphical form in a table');
  }

  const header = [i18n.t('roles.role'), i18n.t('roles.indexes'), i18n.t('roles.spaces')];

  const rows = roles.map((role) => {
    const { name, elasticsearch, kibana } = role;

    const indicesData = elasticsearch.indices.map((indice) => [
      indice.names, indice.privileges,
    ]);

    const spacesAccess = kibana.map(({ base, spaces }) => ({ base: base.join(','), spaces: spaces.join(', ') }));

    return [
      name,
      indicesData.map(([indiceName, indicePrivileges]) => (
        `${i18n.t('roles.names')}: ${indiceName || ''}\n${i18n.t('roles.privileges')}: ${indicePrivileges || ''}`
      )).join('\n'),
      spacesAccess.map(({ base, spaces }) => (
        `${i18n.t('roles.space')}: ${spaces || ''}\n${i18n.t('roles.privileges')}: ${base || ''}`
      )),
    ];
  });

  console.log(table([header, ...rows]));
};
