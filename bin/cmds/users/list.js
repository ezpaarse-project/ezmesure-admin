const { table } = require('table');

const usersLib = require('../../../lib/users');

const { i18n } = global;

exports.command = 'list';
exports.desc = i18n.t('users.list.description');
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: i18n.t('users.list.options.json'),
  });
};
exports.handler = async function handler(argv) {
  let users;
  try {
    const { body } = await usersLib.findAll();
    if (body) { users = body; }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  if (!users) {
    console.log(i18n.t('users.noUsersFound'));
    process.exit(1);
  }

  users = Object.keys(users).map((username) => users[username]);

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
