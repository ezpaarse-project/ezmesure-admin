const { i18n } = global;

const readline = require('readline');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const set = require('lodash.set');
const get = require('lodash.get');
const stream = require('stream');

const logger = require('../../lib/logger');

const ezmesure = require('../../lib/app/ezmesure');
const scopes = require('../../lib/app/config').getScopes();
const kibana = require('../../lib/app/kibana');

exports.command = 'login';
exports.desc = i18n.t('login.description');
exports.builder = function builder(yargs) {
  return yargs.option('u', {
    alias: 'username',
    describe: i18n.t('login.options.username'),
    type: 'string',
  }).option('p', {
    alias: 'password',
    describe: i18n.t('login.options.password'),
    type: 'string',
  }).option('password-stdin', {
    describe: i18n.t('login.options.passwordStdin'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const scope = scopes.local;
  const config = scope.config || {};

  const {
    username, password, passwordStdin, verbose,
  } = argv;

  const credentials = { username, password };

  if (!username) {
    const { user } = await inquirer.prompt([
      {
        type: 'input',
        name: 'user',
        message: i18n.t('login.username'),
      },
    ]);
    credentials.username = user;
  }

  if (!password && !passwordStdin) {
    const { pwd } = await inquirer.prompt([
      {
        type: 'password',
        name: 'pwd',
        mask: '*',
        message: i18n.t('login.password'),
      },
    ]);
    credentials.password = pwd;
  }

  if (passwordStdin) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: stream.Writable(),
      terminal: false,
    });

    // eslint-disable-next-line no-restricted-syntax
    for await (const line of rl) {
      credentials.password = line;
    }
  }

  if (kibana.reservedUsers.includes(credentials.username)) {
    logger.error(`You cannot authenticate with a reserved user [${credentials.username}]`);
    process.exit(1);
  }

  let res;
  try {
    res = await ezmesure.post('/login/local', credentials);
    if (verbose) {
      logger.info('[login]: loggin succefully');
    }
  } catch (error) {
    logger.error(`[login]: Cannot login - ${error.response.status}`);
    process.exit(1);
  }

  if (!get(res.headers, 'set-cookie')) {
    logger.error('[login]: Cannot get ezMESURE token');
    process.exit(1);
  }

  const match = /^eztoken=([a-z0-9._\-\w]+)/i.exec(res?.headers['set-cookie']);
  if (match && match[1]) {
    set(config, 'ezmesure.token', match[1]);

    try {
      await fs.ensureFile(scope.location);
      await fs.writeFile(scope.location, JSON.stringify(config, null, 2));
      if (verbose) {
        logger.info('[login]: API token saved');
      }
    } catch (error) {
      logger.error('[login]: Cannot save API token');
      process.exit(1);
    }

    logger.info(`[login]: [${credentials.username}] logged in succefully`);
  }
};
