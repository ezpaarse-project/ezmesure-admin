const { i18n } = global;

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const rolesLib = require('../../../lib/roles');

exports.command = 'delete [roles...]';
exports.desc = i18n.t('roles.delete.description');
exports.builder = function builder(yargs) {
  return yargs.positional('roles', {
    describe: i18n.t('roles.delete.options.roles'),
    type: 'string',
  });
};
exports.handler = async function handler(argv) {
  let rolesName = argv.roles;

  if (!argv.roles) {
    let roles;
    try {
      const { body } = await rolesLib.findAll();
      if (body) { roles = body; }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }

    const filteredRoles = Object.keys(roles).filter((role) => !roles[role]?.metadata?._reserved);
    const { selectedRoles } = await inquirer.prompt([{
      type: 'checkbox-plus',
      pageSize: 20,
      name: 'selectedRoles',
      message: i18n.t('roles.delete.rolesCheckbox'),
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input || '';

        resolve(filteredRoles.filter((indice) => indice.toLowerCase().includes(input)));
      }),
    }]);

    if (!selectedRoles.length) {
      console.log(i18n.t('roles.noRolesSelected'));
      process.exit(0);
    }

    rolesName = selectedRoles;
  }

  for (let i = 0; i < rolesName.length; i += 1) {
    const role = rolesName[i];
    let response;
    try {
      const { body } = await rolesLib.delete(role);
      if (body) { response = body; }
    } catch (error) {
      if (error?.meta?.body?.error?.reason) {
        console.error(error.meta.body.error.reason);
      }

      if (Object.prototype.hasOwnProperty.call(error?.meta?.body, 'found')) {
        if (!error.meta.body.found) {
          console.error(i18n.t('roles.roleNotFound', { role }));
        }
      }
    }

    if (response && response.found) {
      console.log(i18n.t('roles.delete.deleted', { role }));
    }
  }
};
