const { table } = require('table');

const usersLib = require('../../../lib/users');

exports.command = 'list';
exports.desc = 'List users';
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: 'Print result(s) in json',
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
    console.log('No users found');
    process.exit(1);
  }

  users = Object.keys(users).map((username) => users[username]);

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
