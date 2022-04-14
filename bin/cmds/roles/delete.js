const { i18n } = global;

const rolesLib = require('../../../lib/roles');
const { config } = require('../../../lib/app/config');
const itMode = require('./interactive/delete');
const { formatApiError } = require('../../../lib/utils');

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
  const { it: interactive, verbose } = argv;
  let { roles } = argv;

  if (verbose) {
    console.log(`* Retrieving roles from ${config.ezmesure.baseUrl}`);
  }

  if (interactive) {
    let availableRoles = [];
    try {
      const { data } = await rolesLib.getAll(true);
      if (Array.isArray(data)) {
        availableRoles = data.filter((role) => !role?.metadata?._reserved);
      }
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    try {
      roles = await itMode(availableRoles);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }

  if (!roles.length) {
    console.log(i18n.t('roles.noRolesSpecified'));
    process.exit(0);
  }

  let hasError = false;

  for (let i = 0; i < roles.length; i += 1) {
    const role = roles[i];

    if (verbose) {
      console.log(`* Delete role [${role}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await rolesLib.delete(role);
      console.log(i18n.t('roles.delete.deleted', { role }));
    } catch (error) {
      console.error(formatApiError(error));
      hasError = true;
    }
  }

  process.exit(hasError ? 1 : 0);
};
