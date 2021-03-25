const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const usersLib = require('../../../../lib/users');
const rolesLib = require('../../../../lib/roles');

exports.command = 'delete [user]';
exports.desc = 'Delete role';
exports.builder = function builder(yargs) {
  return yargs.positional('user', {
    describe: 'User name',
    type: 'string',
  }).option('r', {
    alias: 'roles',
    describe: 'Roles name',
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
      console.log('No user found');
      process.exit(0);
    }

    user = user[argv.user];
  }

  if (!argv.user) {
    try {
      const { body } = await usersLib.findAll();
      if (body) { users = body; }
    } catch (error) {
      console.log('No users found');
      process.exit(1);
    }

    if (!users) {
      console.log('No users found');
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
      message: 'Users :',
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
    console.log('No role(s) specified');
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
          console.log(`[Error#${error?.meta?.statusCode}] ${error.message} (role: ${argv.roles[i].toLowerCase()})`);
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
      message: 'Roles :',
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
    console.log('No roles selected');
    process.exit(0);
  }

  user.roles = user.roles.filter((role) => !roles.includes(role));

  try {
    const res = await usersLib.update(user);
    if (res && res.statusCode === 200) {
      console.log(`user [${user.username}] updated successfully`);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
