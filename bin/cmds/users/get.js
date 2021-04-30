const { table } = require('table');
const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);

const usersLib = require('../../../lib/users');

const { i18n } = global;

exports.command = 'get [users...]';
exports.desc = i18n.t('users.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('users', {
    describe: i18n.t('users.get.options.users'),
    type: 'string',
  }).option('j', {
    alias: 'json',
    describe: i18n.t('users.get.options.json'),
    type: 'boolean',
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
    console.log(i18n.t('users.noUsersFound'));
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
      message: i18n.t('users.get.checkboxLabel'),
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

  const header = [i18n.t('users.username'), i18n.t('users.fullName'), i18n.t('users.email'), i18n.t('users.assignedRoles'), i18n.t('users.reserved')];
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
