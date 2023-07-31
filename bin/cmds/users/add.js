const { i18n } = global;

const logger = require('../../../lib/logger');
const { config } = require('../../../lib/app/config');
const usersLib = require('../../../lib/users');

exports.command = 'add <username> <fullName> <email>';
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
    .option('isAdmin', {
      describe: i18n.t('users.add.options.isAdmin'),
      type: 'boolean',
      boolean: true,
    });
};
exports.handler = async function handler(argv) {
  const {
    username,
    fullName,
    email,
    verbose,
  } = argv;

  if (verbose) { logger.setLevel('verbose'); }

  logger.verbose(`Host: ${config.ezmesure.baseUrl}`);

  logger.verbose(`Upsert user [username: ${username}, email: ${email}, fullName: ${fullName}]`);
  try {
    await usersLib.createOrUpdate(username, {
      username,
      email,
      fullName,
      isAdmin: false,
    });
  } catch (error) {
    logger.error(`Cannot get upsert user [username: ${username}, email: ${email}, fullName: ${fullName}] - ${error.response.status}`);
    process.exit(1);
  }

  logger.info(`User [${username}] is upserted`);
};
