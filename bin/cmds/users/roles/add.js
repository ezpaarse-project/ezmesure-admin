const usersLib = require('../../../../lib/users');
const rolesLib = require('../../../../lib/roles');
const { config } = require('../../../../lib/app/config');
const { formatApiError } = require('../../../../lib/utils');
const itMode = require('../interactive/get');

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
  const { users } = argv;
  const { roles, interactive, verbose } = argv;

  if (verbose) {
    console.log(`* Assigning roles [${roles?.join(',')}] to user(s) [${users?.join(',')}] from ${config.ezmesure.baseUrl}`);
  }

  let usersSelected = [];
  if (!users.length) {
    try {
      const { data } = await usersLib.getAll({ size: 1000 });
      usersSelected = data;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }
  }

  if (users.length) {
    for (let i = 0; i < users.length; i += 1) {
      try {
        const { data } = await usersLib.getByUsername(users[i]);
        usersSelected.push(data[users[i]]);
      } catch (error) {
        console.error(formatApiError(error));
        process.exit(1);
      }
    }
  }

  if (interactive) {
    usersSelected = await itMode(usersSelected);
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
      console.error(formatApiError(error));
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
    } catch (error) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (verbose) {
      console.log(`* Update roles for the user [${usersSelected[i].username}]`);
    }

    try {
      user.roles = Array.from(new Set([...rolesSelected, ...user.roles]));
      await usersLib.createOrUpdate(user.username, user);
      console.log(i18n.t('users.roles.add.added', {
        role: rolesSelected.join(', '),
        username: user.username,
      }));
    } catch (error) {
      console.error(formatApiError(error));
    }
  }
};
