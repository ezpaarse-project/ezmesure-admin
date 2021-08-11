const usersLib = require('../../../../lib/users');
const rolesLib = require('../../../../lib/roles');
const { config } = require('../../../../lib/app/config');
const it = require('../interactive/get');

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
  }).option('it', {
    alias: 'interactive',
    describe: i18n.t('users.roles.add.options.interactive'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  let { users } = argv;
  const { roles, interactive, verbose } = argv;

  if (verbose) {
    console.log(`* Assigning roles [${roles?.join(',')}] to the user [${users?.join(',')}] from ${config.ezmesure.baseUrl}`);
  }

  let usersSelected;
  try {
    const { data } = await usersLib.findAll();
    usersSelected = data;
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  if (users.length) {
    users = users.map((user) => user.toLowerCase());
    usersSelected = usersSelected.filter(({ username }) => users.includes(username.toLowerCase()));
  }

  if (interactive) {
    usersSelected = await it(usersSelected);
  }

  if (!usersSelected) {
    console.log(i18n.t('users.noUsersFound'));
    process.exit(0);
  }

  const rolesSelected = [];
  for (let i = 0; i < roles.length; i += 1) {
    try {
      const { data } = await rolesLib.findByName(roles[i]);
      rolesSelected.push(data?.name);
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
  }

  if (!roles.length || !rolesSelected.length) {
    console.log(i18n.t('users.roles.add.noRolesSpecified'));
    process.exit(0);
  }

  for (let i = 0; i < usersSelected.length; i += 1) {
    let user;
    try {
      const { data } = await usersLib.getByUsername(usersSelected[i].username);
      user = data[usersSelected[i].username];

      if (verbose) {
        console.log(`* Update roles for the user [${usersSelected[i].username}]`);
      }
    } catch (error) {
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      user.roles = Array.from(new Set([...rolesSelected, ...user.roles]));
      await usersLib.update(user.username, user);
      console.log(i18n.t('users.roles.add.added', {
        role: rolesSelected.join(', '),
        username: user.username,
      }));
    } catch (error) {
      console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    }
  }
};
