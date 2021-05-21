const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const usersLib = require('../../../../lib/users');
const rolesLib = require('../../../../lib/roles');

const { i18n } = global;

exports.command = 'add [users...]';
exports.desc = i18n.t('users.roles.add.description');
exports.builder = function builder(yargs) {
  return yargs.positional('users', {
    describe: i18n.t('users.roles.add.options.users'),
    type: 'array',
  }).option('r', {
    alias: 'roles',
    describe: i18n.t('users.roles.add.options.roles'),
    type: 'array',
  });
};
exports.handler = async function handler(argv) {
  let users;
  if (argv.users.length) {
    try {
      const { body } = await usersLib.findByName(argv.users);
      if (body) { users = body; }
    } catch (error) {
      console.log(i18n.t('users.roles.add.usersNotFound', { users: argv.users.join(', ') }));
      process.exit(1);
    }
  }

  if (!argv.users.length) {
    try {
      const { body } = await usersLib.findAll();
      if (body) { users = body; }
    } catch (error) {
      console.log(i18n.t('users.noUsersFound'));
      process.exit(1);
    }
  }

  if (!users) {
    console.log(i18n.t('users.noUsersFound'));
    process.exit(0);
  }

  users = Object.keys(users).map((username) => users[username]);

  if (!argv.users.length) {
    const { usersSelected } = await inquirer.prompt([{
      type: 'checkbox-plus',
      name: 'usersSelected',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('users.roles.add.checkboxLabel'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = users
          .map(({ username }) => ({ name: username, value: username }))
          .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    }]);

    users = users.filter(({ username }) => usersSelected.includes(username));
  }

  if (argv.roles && !argv.roles.length) {
    console.log(i18n.t('users.roles.add.noRolesSpecified'));
    process.exit(0);
  }

  let roles = [];
  if (argv.roles && argv.roles.length) {
    for (let i = 0; i < argv.roles.length; i += 1) {
      try {
        const { body } = await rolesLib.findByName(argv.roles[i].toLowerCase());
        if (body) {
          roles.push(argv.roles[i].toLowerCase());
        }
      } catch (error) {
        if (error?.meta) {
          console.log(i18n.t('users.roles.add.errorRoles', {
            statusCode: error?.meta?.statusCode,
            messgae: error.message,
            role: argv.roles[i].toLowerCase(),
          }));
        } else {
          console.log(error);
        }
      }
    }
  }

  if (!argv.roles) {
    let rolesList;
    try {
      const { body } = await rolesLib.findAll();
      if (body) { rolesList = Object.keys(body); }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }

    const { rolesSelected } = await inquirer.prompt([{
      type: 'checkbox-plus',
      name: 'rolesSelected',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('users.roles.add.checkboxRoles'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = rolesList
          .map((role) => ({ name: role, value: role }))
          .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    }]);

    roles = rolesSelected;
  }

  for (let i = 0; i < users.length; i += 1) {
    const user = users[i];
    const rolesAvailable = [];
    for (let j = 0; j < roles.length; j += 1) {
      if (user.roles.includes(roles[j])) {
        console.log(i18n.t('users.roles.add.hasRole', { user: user.username, role: roles[j] }));
      } else {
        rolesAvailable.push(roles[j]);
      }
    }

    user.roles = [
      ...users[i].roles,
      ...rolesAvailable,
    ];

    try {
      const res = await usersLib.update(user);
      if (res && res.statusCode === 200) {
        console.log(i18n.t('users.userUpdated', { user: user.username }));
      }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
};
