/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
const { i18n } = global;

const { table } = require('table');
const Papa = require('papaparse');

const usersLib = require('../../../lib/users');
const itMode = require('./interactive/get');

const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

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
      alias: 'filter',
      describe: i18n.t('users.get.options.filter'),
      type: 'array',
    })
    .option('s', {
      alias: 'size',
      describe: i18n.t('users.get.options.size'),
      type: 'number',
    })
    .option('correspondent', {
      describe: i18n.t('users.get.options.correspondent'),
      choices: ['all', 'tech', 'doc'],
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
    })
    .option('email-list', {
      describe: i18n.t('users.get.options.emailList'),
      type: 'boolean',
    })
    .option('createdAt', {
      describe: i18n.t('users.get.options.createdAt'),
      type: 'string',
    })
    .option('c', {
      alias: 'csv',
      describe: i18n.t('institutions.check.options.csv'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { users } = argv;
  let { size } = argv;

  const {
    json, ndjson, csv, emailList, interactive, verbose, all, filter, createdAt, correspondent,
  } = argv;

  if (all) { size = 10000; }

  if (verbose) {
    console.log(`* Retrieving (${size}) users from ${config.ezmesure.baseUrl}`);
  }

  let usersData = [];
  if (!users.length) {
    try {
      const { data } = await usersLib.getAll({
        size: size || 10,
        source: '*',
      });
      usersData = data;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }
  }

  if (users.length) {
    for (let i = 0; i < users.length; i += 1) {
      try {
        const { data } = await usersLib.getByUsername(users[i]);
        usersData.push(data[users[i]]);
      } catch (error) {
        console.error(formatApiError(error));
        process.exit(1);
      }
    }
  }

  if (correspondent === 'tech') {
    usersData = usersData.filter((user) => user?.roles?.includes('tech_contact'));
  }
  if (correspondent === 'doc') {
    usersData = usersData.filter((user) => user?.roles?.includes('doc_contact'));
  }
  if (correspondent === 'all') {
    usersData = usersData.filter((user) => user?.roles?.includes('tech_contact') || user?.roles?.includes('doc_contact'));
  }

  if (createdAt) {
    usersData = usersData.filter((user) => new Date(user?.metadata?.createdAt).getTime()
      > new Date(createdAt).getTime());
  }

  if (Array.isArray(filter) && filter.length > 0) {
    const filters = usersData.map((user) => {
      const obj = {};
      filter.forEach((field) => {
        obj[field] = user[field];
      });
      return obj;
    });

    usersData = filters;
  }

  if (emailList) {
    if (verbose) {
      console.log('* Export users to txt format');
    }
    usersData = usersData.map((user) => user.email).filter((x) => x).join(';');
    console.log(usersData);
    process.exit(0);
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

  if (csv) {
    if (verbose) {
      console.log('* Export in csv format');
    }

    const csvData = Papa.unparse(usersData);

    console.log(csvData);
    process.exit(0);
  }

  if (verbose) {
    console.log('* Display users in graphical form in a table');
  }

  const header = [i18n.t('users.username'), i18n.t('users.fullName'), i18n.t('users.email'), i18n.t('users.assignedRoles')];
  const rows = usersData.map(({
    username, full_name: fullName, email, roles,
  }) => ([
    username,
    fullName,
    email || '-',
    roles?.join(' '),
  ]));

  console.log(table([header, ...rows]));
};
