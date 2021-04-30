const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const usersLib = require('../../../../lib/users');
const rolesLib = require('../../../../lib/roles');

const { i18n } = global;

exports.command = 'delete [user]';
exports.desc = i18n.t('users.roles.delete.description');
exports.builder = function builder(yargs) {
  return yargs.positional('user', {
    describe: i18n.t('users.roles.delete.options.user'),
    type: 'string',
  }).option('r', {
    alias: 'roles',
    describe: i18n.t('users.roles.delete.options.roles'),
    type: 'array',
  });
};
exports.handler = async function handler(argv) {
  let users;
  let { user } = argv;

  if (argv.user) {
    try {
      const { body } = await usersLib.findByName([user]);
      if (body) { user = body; }
    } catch (error) {
      console.log(`user [${user}] not found`);
      process.exit(1);
    }

    if (!user) {
      console.log(i18n.t('users.noUserFound'));
      process.exit(0);
    }

    user = user[argv.user];
  }

  if (!argv.user) {
    try {
      const { body } = await usersLib.findAll();
      if (body) { users = body; }
    } catch (error) {
      console.log(i18n.t('users.noUsersFound'));
      process.exit(1);
    }

    if (!users) {
      console.log(i18n.t('users.noUsersFound'));
      process.exit(0);
    }

    users = Object.keys(users).map((username) => users[username]);
  }

  if (!argv.user) {
    const { userSelected } = await inquirer.prompt([{
      type: 'autocomplete',
      name: 'userSelected',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('users.roles.delete.checkboxUsers'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input ? input.toLowerCase() : '';

        const result = users
          .map(({ username }) => ({ name: username, value: username }))
          .filter(({ name }) => name.toLowerCase().includes(input));

        resolve(result);
      }),
    }]);

    users = users.filter(({ username }) => userSelected.includes(username));
    if (users.length) {
      [user] = users;
    }
  }

  if (argv.roles && !argv.roles.length) {
    console.log(i18n.t('users.roles.delete.noRolesSpecified'));
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
          console.log(i18n.t('users.roles.delete.errorRoles', {
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

  if (!argv.roles && user) {
    const { rolesSelected } = await inquirer.prompt([{
      type: 'checkbox-plus',
      name: 'rolesSelected',
      pageSize: 20,
      searchable: true,
      highlight: true,
      message: i18n.t('users.roles.delete.checkboxRoles'),
      source: (answersSoFar, input) => new Promise((resolve) => {
        const result = user.roles
          .map((role) => ({ name: role, value: role }))
          .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

        resolve(result);
      }),
    }]);

    roles = rolesSelected;
  }

  if (!roles) {
    console.log(i18n.t('users.roles.delete.noRolesSelected'));
    process.exit(0);
  }

  user.roles = user.roles.filter((role) => !roles.includes(role));

  try {
    const res = await usersLib.update(user);
    if (res && res.statusCode === 200) {
      console.log(i18n.t('users.userUpdated', { user: user.username }));
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
