const { i18n } = global;

const readline = require('readline');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const set = require('lodash.set');
const get = require('lodash.get');
const stream = require('stream');

const ezmesure = require('../../lib/app/ezmesure');
const scopes = require('../../lib/app/config').getScopes();
const kibana = require('../../lib/app/kibana');
const { formatApiError } = require('../../lib/utils');

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

  if (password) {
    console.log(i18n.t('login.warning'));
  }

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
    console.error(`You cannot authenticate with a reserved user [${credentials.username}]`);
    process.exit(1);
  }

  if (verbose) {
    console.log(`* Login from ${config?.ezmesure?.baseUrl}`);
  }

  let res;
  try {
    res = await ezmesure.post('/login/local', credentials);
  } catch (error) {
    console.error(formatApiError(error));
    console.error(i18n.t('login.loginFailed', { username: credentials.username }));
    process.exit(1);
  }

  if (verbose) {
    console.log('* API token recovery');
  }

  if (!get(res.headers, 'set-cookie')) {
    console.error('ezMESURE Token not found');
    process.exit(1);
  }

  const match = /^eztoken=([a-z0-9._\-\w]+)/i.exec(res?.headers['set-cookie']);
  if (match && match[1]) {
    set(config, 'ezmesure.token', match[1]);

    if (verbose) {
      console.log('* API token recovered');
    }

    try {
      if (verbose) {
        console.log('* Saving the API token');
      }

      await fs.ensureFile(scope.location);
      await fs.writeFile(scope.location, JSON.stringify(config, null, 2));
    } catch (error) {
      if (verbose) {
        console.log('* Failed to save the API token');
      }

      console.error(error);
      process.exit(1);
    }

    console.log(i18n.t('login.loggedIn', { username: credentials.username }));
  }
};
