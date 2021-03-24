const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const usersLib = require('../../../../lib/users');
const rolesLib = require('../../../../lib/roles');

exports.command = 'add [users...]';
exports.desc = 'Add role';
exports.builder = function builder(yargs) {
  return yargs.positional('users', {
    describe: 'Users name',
    type: 'array',
  }).option('r', {
    alias: 'roles',
    describe: 'Roles name',
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
      console.log(`user(s) [${argv.users.join(', ')}] not found`);
      process.exit(1);
    }
  }

  if (!argv.users.length) {
    try {
      const { body } = await usersLib.findAll();
      if (body) { users = body; }
    } catch (error) {
      console.log('No users found');
      process.exit(1);
    }
  }

  if (!users) {
    console.log('No users found');
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
      message: 'Users :',
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
      message: 'Roles :',
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
        console.log(`user [${user.username}] has already role [${roles[j]}]`);
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
        console.log(`user [${user.username}] updated successfully`);
      }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }
};
