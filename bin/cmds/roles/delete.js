const { i18n } = global;

const rolesLib = require('../../../lib/roles');
const it = require('./interactive/get');

exports.command = 'delete [roles...]';
exports.desc = i18n.t('roles.delete.description');
exports.builder = function builder(yargs) {
  return yargs.positional('roles', {
    describe: i18n.t('roles.delete.options.roles'),
    type: 'array',
  }).option('it', {
    describe: i18n.t('roles.delete.options.interactive'),
    boolean: true,
  });
};
exports.handler = async function handler(argv) {
  const { roles: rolesName, it: interactive } = argv;

  let roles;
  try {
    const { data } = await rolesLib.findAll(true);
    roles = data;
  } catch (error) {
    console.error(error);
    console.error(i18n.t('roles.rolesNotFound'));
    process.exit(1);
  }

  if (rolesName.length) {
    roles = roles.filter(({ name }) => rolesName.includes(name));
  }

  if (interactive) {
    try {
      roles = await it(roles);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  if (!roles.length) {
    console.log(i18n.t('roles.rolesNotFound'));
    process.exit(0);
  }

  for (let i = 0; i < roles.length; i += 1) {
    const { name: role } = roles[i];
    try {
      await rolesLib.delete(role);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
    console.log(i18n.t('roles.delete.deleted', { role }));
  }
};
