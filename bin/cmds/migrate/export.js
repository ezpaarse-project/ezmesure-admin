const { i18n } = global;

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const chalk = require('chalk');
const elastic = require('../../../lib/app/elastic');

exports.command = 'export';
exports.desc = i18n.t('export.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('o', {
      alias: 'out',
      describe: i18n.t('export.options.out'),
      type: 'string',
    })
    .option('b', {
      alias: 'bulk-size',
      describe: i18n.t('export.options.bulkSize'),
      type: 'number',
      default: 1000,
    });
};

const exportUsers = async (opts) => {
  console.log(chalk.blue('i Exporting users...'));
  console.group();
  const userFile = fs.createWriteStream(path.join(opts.dumpFolder, 'users.jsonl'));
  console.log(chalk.grey('  Opening new file for users...'));

  const { body } = await elastic.security.getUser({});
  const users = Object.values(body).filter((u) => {
    if (u.metadata._reserved) {
      return false;
    }
    if (u.metadata._deprecated) {
      return false;
    }
    return u.username !== 'ezmesure-admin';
  });

  for (const user of users) {
    userFile.write(`${JSON.stringify(user)}\n`);
  }

  userFile.end();
  console.log(chalk.green(` ${users.length} users exported to "${chalk.underline(userFile.path)}"`));
  console.groupEnd();
  return users;
};

const exportRoles = async (opts) => {
  console.log(chalk.blue('i Exporting roles...'));
  console.group();
  const roleFile = fs.createWriteStream(path.join(opts.dumpFolder, 'roles.jsonl'));
  console.log(chalk.grey('  Opening new file for roles...'));

  const { body } = await elastic.security.getRole({});
  const entries = Object.entries(body).filter(([, r]) => {
    if (r.metadata._reserved) {
      return false;
    }
    return !r.metadata._deprecated;
  });

  const roles = [];
  for (const [name, raw] of entries) {
    const role = { name, ...raw };
    roleFile.write(`${JSON.stringify(role)}\n`);
    roles.push(role);
  }

  roleFile.end();
  console.log(chalk.green(` ${roles.length} roles exported to "${chalk.underline(roleFile.path)}"`));
  console.groupEnd();
  return roles;
};

const exportDepositors = async (opts) => {
  console.log(chalk.blue('i Exporting depositors...'));
  console.group();
  const depositorFolder = path.join(opts.dumpFolder, 'depositors');
  await fsp.mkdir(depositorFolder, { recursive: true });

  const res = {};
  const fileStreams = {};
  const scroll = elastic.helpers.scrollSearch(
    {
      index: 'depositors',
      body: {
        query: {
          query_string: {
            query: '!type:(task)',
          },
        },
      },
      size: opts.bulkSize,
    },
  );
  console.log(chalk.grey('  Got scroll for depositors...'));

  for await (const { body: result } of scroll) {
    console.log(chalk.grey('  Still scrolling...'));
    console.group();
    for (const [type, docs] of Object.entries(res)) {
      console.log(chalk.grey(`  ${type}: ${docs.length}`));
    }
    console.groupEnd();

    for (const { _id, _source: depositor } of result.hits.hits) {
      // init stream if not opened
      if (!fileStreams[depositor.type]) {
        console.log(chalk.grey(`  Opening new file for ${depositor.type}...`));
        fileStreams[depositor.type] = fs.createWriteStream(path.join(depositorFolder, `${depositor.type}.jsonl`));
        res[depositor.type] = [];
      }

      const doc = {
        id: _id.split(':')[1],
        ...depositor[depositor.type],
      };

      fileStreams[depositor.type].write(`${JSON.stringify(doc)}\n`);
      res[depositor.type].push(doc);
    }
  }

  // close all opened streams
  for (const type of Object.keys(fileStreams)) {
    console.log(chalk.green(` ${res[type].length} ${type} exported to "${chalk.underline(fileStreams[type].path)}"`));
    fileStreams[type].end();
  }
  console.groupEnd();
  return res;
};

const exportInstitutions = async (opts) => {
  console.log(chalk.blue('i Exporting institutions...'));
  console.group();
  const res = [];
  const institutionFile = fs.createWriteStream(path.join(opts.dataFolder, 'institutions.jsonl'));
  console.log(chalk.grey('  Opening new file for institutions...'));

  for (const raw of opts.depositors.institution) {
    const roles = opts.roles.filter((r) => r.name === raw.role || r.name === `${raw.role}_read_only`);
    const rolesNames = new Set(roles.map((r) => r.name));

    const institution = {
      ...raw,
      roles,
      sushi: opts.depositors.sushi.filter((s) => s.institutionId === raw.id),
      members: opts.users.filter((u) => u.roles.some((r) => rolesNames.has(r))),
    };

    institutionFile.write(`${JSON.stringify(institution)}\n`);
    res.push(institution);
  }

  console.log(chalk.green(` ${res.length} institutions exported to "${chalk.underline(institutionFile.path)}"`));
  console.groupEnd();
  return res;
};

exports.handler = async function handler(argv) {
  const { out, bulkSize } = argv;

  let dataFolder;
  if (out) {
    dataFolder = path.resolve(out);
  } else {
    const now = new Date();
    dataFolder = path.resolve(now.toISOString());
  }
  const dumpFolder = path.join(dataFolder, 'dump');
  await fsp.mkdir(dumpFolder, { recursive: true });

  try {
    const depositors = await exportDepositors({ dumpFolder, bulkSize });
    const users = await exportUsers({ dumpFolder });
    const roles = await exportRoles({ dumpFolder });

    await exportInstitutions({
      depositors, users, roles, dataFolder,
    });

    console.log(chalk.green(` Data exported to "${chalk.underline(dataFolder)}"`));
  } catch (error) {
    await fsp.writeFile(path.join(dataFolder, 'error.log'), JSON.stringify(error, undefined, 4), 'utf-8');
    throw error;
  }
};
