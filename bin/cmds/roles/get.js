const { i18n } = global;

const { table } = require('table');
const rolesLib = require('../../../lib/roles');

exports.command = 'get <role>';
exports.desc = i18n.t('roles.get.description');
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: i18n.t('roles.get.options.json'),
  });
};
exports.handler = async function handler(argv) {
  const { role: roleName } = argv;

  let role;

  try {
    const { body } = await rolesLib.findByName(roleName);
    if (body) { role = body; }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  if (!role) {
    console.log(i18n.t('roles.roleNotFound', { role: roleName }));
    process.exit(0);
  }

  if (argv && argv.json) {
    console.log(JSON.stringify(role, null, 2));
    process.exit(0);
  }

  const header = [i18n.t('roles.role'), i18n.t('roles.indexes'), i18n.t('roles.applications')];

  const { indices, applications } = role[roleName];

  const [indicesNames, indicesPrivileges] = indices.map((indice) => [
    indice.names, indice.privileges,
  ]);

  const application = applications.map((appli) => appli.application);
  const row = [
    [
      roleName,
      `${i18n.t('roles.names')}: ${indicesNames || ''}\n${i18n.t('roles.privileges')}: ${indicesPrivileges || ''}`,
      `${i18n.t('roles.applications')}: ${application || ''}`,
    ],
  ];

  console.log(table([header, ...row]));
};
