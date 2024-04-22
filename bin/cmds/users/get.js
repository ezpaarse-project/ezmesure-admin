/* eslint-disable array-callback-return */
/* eslint-disable consistent-return */
const { i18n } = global;

const { table } = require('table');
const Papa = require('papaparse');

const logger = require('../../../lib/logger');

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
    .option('email-list', {
      describe: i18n.t('users.get.options.emailList'),
      type: 'boolean',
    })
    .option('createdForm', {
      describe: i18n.t('users.get.options.createdForm'),
      type: 'string',
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
    json, ndjson, csv, emailList, interactive, verbose, all, filter, createdForm, correspondent,
  } = argv;

  if (all) { size = 10000; }

  if (verbose) { logger.setLevel('verbose'); }

  logger.verbose(`Host: ${config.ezmesure.baseUrl}`);

  let usersData = [];
  if (!users.length) {
    logger.verbose('Get all users');
    try {
      const { data } = await usersLib.getAll({
        size: size || 10,
        source: '*',
        include: 'memberships.institution',
      });
      usersData = data;
    } catch (error) {
      logger.error(`Cannot get all users - ${error.response.status}`);
      process.exit(1);
    }
  }

  if (users.length) {
    for (let i = 0; i < users.length; i += 1) {
      try {
        const { data } = await usersLib.getByUsername(users[i]);
        usersData.push(data);
      } catch (error) {
        logger.error(`Cannot get all user [${users[i]}] - ${error.response.status}`);
        process.exit(1);
      }
    }
  }

  if (correspondent === 'tech') {
    logger.verbose('Filter by tech correspondent');
    usersData = usersData.filter((user) => user?.memberships?.find((membership) => membership.roles.includes('contact:tech')));
  }
  if (correspondent === 'doc') {
    logger.verbose('Filter by doc correspondent');
    usersData = usersData.filter((user) => user?.memberships?.find((membership) => membership.roles.includes('contact:doc')));
  }
  if (correspondent === 'all') {
    logger.verbose('Filter by correspondent');
    usersData = usersData.filter((user) => user?.memberships?.find((membership) => membership.roles.includes('contact:tech'))
    || user?.memberships?.find((membership) => membership.roles.includes('contact:doc')));
  }

  if (createdForm) {
    logger.verbose(`Filter by users created after [${createdForm}]`);
    usersData = usersData.filter((user) => new Date(user?.metadata?.createdForm).getTime()
      > new Date(createdForm).getTime());
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
    logger.verbose('Filter email of users');
    usersData = usersData.map((user) => user.email).filter((x) => x).join(';');
    console.log(usersData);
    process.exit(0);
  }

  if (interactive) {
    logger.verbose('Use interactive mode');
    usersData = await itMode(usersData);
  }

  if (!usersData) {
    logger.error(i18n.t('users.noUsersFound'));
    process.exit(0);
  }

  if (ndjson) {
    logger.verbose('Return ndjson');
    usersData.forEach((user) => console.log(JSON.stringify(user)));
    process.exit(0);
  }

  if (json) {
    logger.verbose('Return json');
    console.log(JSON.stringify(usersData, null, 2));
    process.exit(0);
  }

  if (csv) {
    logger.verbose('Return csv');
    const csvData = Papa.unparse(usersData);
    console.log(csvData);
    process.exit(0);
  }

  logger.verbose('Display users on table');

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
