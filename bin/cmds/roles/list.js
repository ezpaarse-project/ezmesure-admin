const { i18n } = global;

const { table } = require('table');
const rolesLib = require('../../../lib/roles');

exports.command = 'list';
exports.desc = i18n.t('roles.list.description');
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: i18n.t('roles.list.options.json'),
  });
};
exports.handler = async function handler(argv) {
  let roles;

  try {
    const { body } = await rolesLib.findAll();
    if (body) { roles = body; }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  if (!roles) {
    console.log(i18n.t('roles.rolesNotFound'));
    process.exit(0);
  }

  if (argv && argv.json) {
    console.log(JSON.stringify(roles, null, 2));
    process.exit(0);
  }

  const header = [i18n.t('roles.role'), i18n.t('roles.indexes'), i18n.t('roles.applications')];

  const rows = Object.keys(roles).map((roleName) => {
    const { indices, applications } = roles[roleName];

    const [indicesNames, indicesPrivileges] = indices.map((indice) => [
      indice.names, indice.privileges,
    ]);

    const application = applications.map((appli) => appli.application);
    return [
      roleName,
      `${i18n.t('roles.names')}: ${indicesNames || ''}\n${i18n.t('roles.privileges')}: ${indicesPrivileges || ''}`,
      `${i18n.t('roles.applications')}: ${application || ''}`,
    ];
  });

  console.log(table([header, ...rows]));
};
