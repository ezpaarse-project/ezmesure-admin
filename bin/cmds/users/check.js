const { i18n } = global;

const { table } = require('table');
const Papa = require('papaparse');
const chalk = require('chalk');

const usersLib = require('../../../lib/users');
const rolesLib = require('../../../lib/roles');
const itMode = require('./interactive/get');

exports.command = 'check [users...]';
exports.desc = i18n.t('users.check.description');
exports.builder = function builder(yargs) {
  return yargs.positional('users', {
    describe: i18n.t('users.check.options.users'),
    type: 'string',
  })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('users.check.options.interactive'),
      boolean: true,
    })
    .option('j', {
      alias: 'json',
      describe: i18n.t('users.check.options.json'),
      type: 'boolean',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('users.check.options.ndjson'),
      type: 'boolean',
    })
    .option('c', {
      alias: 'csv',
      describe: i18n.t('users.check.options.csv'),
      type: 'boolean',
    });
};
exports.handler = async function handler(argv) {
  const { users } = argv;

  const {
    json, ndjson, csv, interactive, verbose,
  } = argv;

  let usersData = [];
  if (!users.length) {
    try {
      const { data } = await usersLib.getAll({
        size: 10000,
        source: 'full_name,username,roles,email,metadata',
      });
      usersData = data;
    } catch (error) {
      console.log(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
      process.exit(1);
    }
  } else {
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

  let allRoles;

  try {
    ({ data: allRoles } = await rolesLib.getAll());
  } catch (error) {
    console.log(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
    process.exit(1);
  }

  if (interactive) {
    usersData = await itMode(usersData);
  }

  if (!usersData) {
    console.log(i18n.t('users.noUsersFound'));
    process.exit(0);
  }

  const checkUsers = [];

  for (const user of usersData) {
    const checkUser = {
      username: user.username || false,
      fullName: user.full_name || false,
      email: user.email || false,
      roles: user.roles || false,
      spaces: [],
      institution: false,
    };

    let spaces = [];

    for (const roleName of user.roles) {
      const role = allRoles.find((e) => e.name === roleName);
      if (role) {
        let space = role?.kibana[0]?.spaces;
        if (space) {
          space = space.filter((e) => e !== undefined);
          spaces = spaces.concat(space);
        }
      }
    }

    let institution;

    try {
      institution = await usersLib.getInstitutionByUsername(checkUser.username);
    } catch (error) {
      if (error.response.status !== 404) {
        console.log(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
        process.exit(1);
      }
    }

    if (institution) {
      checkUser.institution = institution?.data?.name;
    }

    if (spaces.length >= 1) {
      checkUser.spaces = spaces;
    }

    checkUsers.push(checkUser);
  }

  usersData = checkUsers;

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

  const header = [
    i18n.t('users.username'),
    i18n.t('users.fullName'),
    i18n.t('users.email'),
    i18n.t('users.assignedRoles'),
    i18n.t('users.assignedSpaces'),
    i18n.t('users.institution'),
  ];

  if (verbose) {
    console.log('* Display users in graphical form in a table');
  }

  const red = chalk.hex('#e55039').bold;
  const green = chalk.hex('#78e08f').bold;
  const blue = chalk.hex('#3498DB').bold;
  const yellow = chalk.hex('#F4D03F').bold;

  const rows = checkUsers.map(({
    username,
    fullName,
    email,
    roles,
    spaces,
    institution,
  }) => ([
    username,
    fullName ? green(fullName) : red(fullName),
    email ? green(email) : red(email),
    [
      blue(roles?.includes('new_user') ? 'new_user' : ''),
      yellow(roles?.includes('superuser') ? 'superuser' : ''),
      ...roles?.filter((r) => r !== 'superuser' && r !== 'new_user').map((role) => green(role)),
    ].filter((x) => x).join(',') || red(false),
    [
      blue(spaces?.includes('bienvenue') ? 'bienvenue' : ''),
      ...spaces?.filter((r) => r !== 'bienvenue').map((space) => green(space)),
    ].filter((x) => x).join(',') || red(false),
    institution ? green(institution) : red(institution),
  ]));

  console.log(table([header, ...rows]));
};
