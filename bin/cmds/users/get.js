const { i18n } = global;

const { table } = require('table');

const usersLib = require('../../../lib/users');
const it = require('./interactive/get');

exports.command = 'get [users...]';
exports.desc = i18n.t('users.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('users', {
    describe: i18n.t('users.get.options.users'),
    type: 'string',
  }).option('it', {
    alias: 'interactive',
    describe: i18n.t('users.get.options.interactive'),
    boolean: true,
  }).option('j', {
    alias: 'json',
    describe: i18n.t('users.get.options.json'),
    type: 'boolean',
  }).option('ndjson', {
    describe: i18n.t('users.get.options.ndjson'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  let { users } = argv;
  const { json, ndjson, interactive } = argv;

  let usersData;
  try {
    const { data } = await usersLib.findAll();
    usersData = data;
  } catch (error) {
    console.log(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  if (users.length) {
    users = users.map((user) => user.toLowerCase());
    usersData = usersData.filter(({ username }) => users.includes(username.toLowerCase()));
  }

  if (interactive) {
    usersData = await it(usersData);
  }

  if (!usersData) {
    console.log(i18n.t('users.noUsersFound'));
    process.exit(0);
  }

  if (ndjson) {
    usersData.forEach((user) => console.log(JSON.stringify(user)));
    process.exit(0);
  }

  if (json) {
    console.log(JSON.stringify(usersData, null, 2));
    process.exit(0);
  }

  for (let i = 0; i < usersData.length; i += 1) {
    try {
      const { data } = await usersLib.getByUsername(usersData[i].username);
      usersData[i] = data[usersData[i].username];
    } catch (error) {
      // eslint-disable-next-line no-continue
      continue;
    }
  }

  const header = [i18n.t('users.username'), i18n.t('users.fullName'), i18n.t('users.email'), i18n.t('users.assignedRoles')];
  const row = usersData.map(({
    username, full_name: fullName, email, roles,
  }) => ([
    username,
    fullName,
    email,
    roles.join(' '),
  ]));

  console.log(table([header, ...row]));
};
