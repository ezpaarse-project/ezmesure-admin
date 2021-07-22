const { i18n } = global;

const usersLib = require('../../../lib/users');

exports.command = 'add <username> <password>';
exports.desc = i18n.t('users.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('username', {
    describe: i18n.t('users.add.options.username'),
    type: 'string',
  })
    .positional('password', {
      describe: i18n.t('users.add.options.password'),
      type: 'string',
    })
    .option('e', {
      alias: 'email',
      describe: i18n.t('users.add.options.email'),
      type: 'string',
    })
    .option('n', {
      alias: 'full-name',
      describe: i18n.t('users.add.options.fullName'),
      type: 'string',
    })
    .option('r', {
      alias: 'roles',
      describe: i18n.t('users.add.options.roles'),
      type: 'string',
    })
    .option('enabled', {
      describe: i18n.t('users.add.options.enabled'),
      type: 'boolean',
      boolean: true,
    });
};
exports.handler = async function handler(argv) {
  const {
    username,
    password,
    roles,
    enabled,
    fullName,
  } = argv;

  try {
    await usersLib.createOrUpdate(username, {
      username,
      password,
      enabled,
      roles: roles && roles.split(','),
      full_name: fullName,
      metadata: {
        acceptedTerms: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        uid: username,
      },
    });
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  console.log(i18n.t('users.add.created', { username }));
};
