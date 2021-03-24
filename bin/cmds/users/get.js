const { table } = require('table');
const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const usersLib = require('../../../lib/users');

exports.command = 'get [users...]';
exports.desc = 'Get one or more users';
exports.builder = function builder(yargs) {
  return yargs.positional('users', {
    describe: 'Users name',
    type: 'string',
  }).option('j', {
    alias: 'json',
    describe: 'Print result(s) in json',
  });
};
exports.handler = async function handler(argv) {
  let users;
  if (argv.users.length) {
    try {
      const { body } = await usersLib.findByName(argv.users);
      if (body) { users = body; }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

  if (!argv.users.length) {
    try {
      const { body } = await usersLib.findAll();
      if (body) { users = body; }
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

  if (!users) {
    console.log('No users found');
    process.exit(1);
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

  if (argv.json) {
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  }

  const header = ['Username', 'Full name', 'email', 'roles', 'reserved'];
  const row = users.map(({
    username, full_name: fullName, email, roles, metadata: { _reserved },
  }) => ([
    username,
    fullName,
    email,
    roles.join(' '),
    _reserved,
  ]));

  console.log(table([header, ...row]));
};
