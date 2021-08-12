const { i18n } = global;

const { table } = require('table');

const usersLib = require('../../../lib/users');
const itMode = require('./interactive/get');

const { config } = require('../../../lib/app/config');

exports.command = 'get [users...]';
exports.desc = i18n.t('users.get.description');
exports.builder = function builder(yargs) {
  return yargs.positional('users', {
    describe: i18n.t('users.get.options.users'),
    type: 'string',
  })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('users.get.options.interactive'),
      boolean: true,
    })
    .option('f', {
      alias: 'fields',
      describe: i18n.t('users.get.options.fields'),
      type: 'string',
    })
    .option('s', {
      alias: 'size',
      describe: i18n.t('users.get.options.size'),
      type: 'number',
    })
    .option('a', {
      alias: 'all',
      describe: i18n.t('users.get.options.all'),
      boolean: true,
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('users.get.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('users.get.options.ndjson'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { users } = argv;
  let { size } = argv;

  const {
    json, ndjson, interactive, verbose, fields = 'full_name,username,roles,email,metadata', all,
  } = argv;

  if (all) { size = 10000; }

  if (verbose) {
    console.log(`* Retrieving (${size}) users (fields: ${fields}) from ${config.ezmesure.baseUrl}`);
  }

  let usersData = [];
  if (!users.length) {
    try {
      const { data } = await usersLib.findAll({
        size: size || 10,
        source: fields,
      });
      usersData = data;
    } catch (error) {
      console.log(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
      process.exit(1);
    }
  }

  if (users.length) {
    for (let i = 0; i < users.length; i += 1) {
      try {
        const { data } = await usersLib.getByUsername(users[i]);
        usersData.push(data[users[i]]);
      } catch (error) {
        console.log(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
        process.exit(1);
      }
    }
  }

  if (interactive) {
    usersData = await itMode(usersData);
  }

  if (!usersData) {
    console.log(i18n.t('users.noUsersFound'));
    process.exit(0);
  }

  if (ndjson) {
    if (verbose) {
      console.log('* Export users to ndjson format');
    }

    usersData.forEach((user) => console.log(JSON.stringify(user)));
    process.exit(0);
  }

  if (json) {
    if (verbose) {
      console.log('* Export users to json format');
    }

    console.log(JSON.stringify(usersData, null, 2));
    process.exit(0);
  }

  if (verbose) {
    console.log('* Display users in graphical form in a table');
  }

  const header = [i18n.t('users.username'), i18n.t('users.fullName'), i18n.t('users.email'), i18n.t('users.assignedRoles')];
  const row = usersData.map(({
    username, full_name: fullName, email, roles,
  }) => ([
    username,
    fullName,
    email || '-',
    roles?.join(' '),
  ]));

  console.log(table([header, ...row]));
};
