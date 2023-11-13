const { i18n } = global;

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const cliProgress = require('cli-progress');
const chalk = require('chalk');
const elastic = require('../../../lib/app/elastic');

exports.command = 'export';
exports.desc = i18n.t('migrate.export.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('o', {
      alias: 'out',
      describe: i18n.t('migrate.export.options.out'),
      type: 'string',
      default: new Date().toISOString(),
    })
    .option('b', {
      alias: 'bulk-size',
      describe: i18n.t('migrate.export.options.bulkSize'),
      type: 'number',
      default: 1000,
    });
};

const exportUsers = async (opts) => {
  console.log(chalk.blue(i18n.t('migrate.export.going', { type: 'users' })));
  console.group();
  const userFile = fs.createWriteStream(path.join(opts.dumpFolder, 'users.jsonl'));
  console.log(chalk.grey(i18n.t('migrate.export.file', { type: 'users' })));

  const bar = new cliProgress.SingleBar(
    {
      format: chalk.grey('    {bar} | {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );

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

  bar.start(users.length, 0);
  for (const user of users) {
    userFile.write(`${JSON.stringify(user)}\n`);
    bar.increment();
  }

  userFile.end();
  bar.stop();
  console.log(chalk.green(
    i18n.t(
      'migrate.export.ok',
      {
        count: users.length,
        type: 'users',
        out: chalk.underline(userFile.path),
        warns: chalk.yellow(0),
      },
    ),
  ));
  console.groupEnd();
  return users;
};

const exportRoles = async (opts) => {
  console.log(chalk.blue(i18n.t('migrate.export.going', { type: 'roles' })));
  console.group();
  const roleFile = fs.createWriteStream(path.join(opts.dumpFolder, 'roles.jsonl'));
  console.log(chalk.grey(i18n.t('migrate.export.file', { type: 'roles' })));

  const bar = new cliProgress.SingleBar(
    {
      format: chalk.grey('    {bar} | {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );

  const { body } = await elastic.security.getRole({});
  const entries = Object.entries(body).filter(([, r]) => {
    if (r.metadata._reserved) {
      return false;
    }
    return !r.metadata._deprecated;
  });

  bar.start(entries.length, 0);
  const roles = entries.map(
    ([name, raw]) => {
      const role = { name, ...raw };
      roleFile.write(`${JSON.stringify(role)}\n`);
      bar.increment();
      return role;
    },
  );

  roleFile.end();
  bar.stop();
  console.log(chalk.green(
    i18n.t(
      'migrate.export.ok',
      {
        count: roles.length,
        type: 'roles',
        out: chalk.underline(roleFile.path),
        warns: chalk.yellow(0),
      },
    ),
  ));
  console.groupEnd();
  return roles;
};

const exportDepositors = async (opts) => {
  console.log(chalk.blue(i18n.t('migrate.export.going', { type: 'depositors' })));
  console.group();
  const depositorFolder = path.join(opts.dumpFolder, 'depositors');
  await fsp.mkdir(depositorFolder, { recursive: true });

  const multibar = new cliProgress.MultiBar(
    {
      emptyOnZero: true,
      format: chalk.grey('    {bar} | {type} | {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );

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
  console.log(chalk.grey(i18n.t('migrate.export.scroll.got', { type: 'depositors' })));

  const bars = {};

  for await (const { body: result } of scroll) {
    for (const type of Object.keys(fileStreams)) {
      const typeInCurrent = result.hits.hits.filter((h) => h._source.type === type).length;
      bars[type].setTotal(res[type].length + typeInCurrent);
    }

    for (const { _id, _source: depositor } of result.hits.hits) {
      // init stream if not opened
      if (!fileStreams[depositor.type]) {
        bars[depositor.type] = multibar.create(0, 0);
        multibar.log(`  ${chalk.grey(i18n.t('migrate.export.file', { type: depositor.type }))}\n`);

        fileStreams[depositor.type] = fs.createWriteStream(path.join(depositorFolder, `${depositor.type}.jsonl`));
        res[depositor.type] = [];
      }

      const doc = {
        id: _id.split(':')[1],
        ...depositor[depositor.type],
      };

      fileStreams[depositor.type].write(`${JSON.stringify(doc)}\n`);
      res[depositor.type].push(doc);
      bars[depositor.type].increment(1, { type: depositor.type });
    }
  }

  multibar.stop();
  // close all opened streams
  for (const type of Object.keys(fileStreams)) {
    console.log(chalk.green(
      i18n.t(
        'migrate.export.ok',
        {
          count: res[type].length,
          type,
          out: chalk.underline(fileStreams[type].path),
          warns: chalk.yellow(0),
        },
      ),
    ));
    fileStreams[type].end();
  }
  console.groupEnd();
  return res;
};

const exportInstitutions = async (opts) => {
  console.log(chalk.blue(i18n.t('migrate.export.going', { type: 'institutions' })));
  console.group();
  const institutionFile = fs.createWriteStream(path.join(opts.dataFolder, 'institutions.jsonl'));
  const logFile = fs.createWriteStream(path.join(opts.dataFolder, 'institutions.log'));
  console.log(chalk.grey(i18n.t('migrate.export.file', { type: 'institutions' })));

  const bar = new cliProgress.SingleBar(
    {
      format: chalk.grey('    {bar} | {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );

  let warns = 0;
  const res = opts.depositors.institution.map(
    (raw) => {
      const roles = opts.roles.filter((r) => r.name === raw.role || r.name === `${raw.role}_read_only`);
      const rolesNames = new Set(roles.map((r) => r.name));

      const institution = {
        ...raw,
        roles,
        sushi: opts.depositors.sushi.filter((s) => s.institutionId === raw.id),
        members: opts.users.filter((u) => u.roles.some((r) => rolesNames.has(r))),
      };

      if (roles.length <= 0) {
        logFile.write(`warn: ${i18n.t('migrate.export.noRoles', { institution: institution.name })}\n`);
        warns += 1;
      } else if (institution.members.length <= 0) {
        logFile.write(`warn: ${i18n.t('migrate.export.noMembers', { institution: institution.name })}\n`);
        warns += 1;
      }

      institutionFile.write(`${JSON.stringify(institution)}\n`);
      bar.increment();
      return institution;
    },
  );

  logFile.end();
  institutionFile.end();

  bar.stop();
  console.log(chalk.green(
    i18n.t('migrate.export.ok', {
      count: res.length,
      type: 'institutions',
      out: chalk.underline(institutionFile.path),
      warns: chalk.yellow(warns),
    }),
  ));
  console.groupEnd();
  return res;
};

exports.handler = async function handler(argv) {
  const { out, bulkSize } = argv;

  const dataFolder = path.resolve(out);
  const dumpFolder = path.join(dataFolder, 'dump');
  await fsp.mkdir(dumpFolder, { recursive: true });

  try {
    const depositors = await exportDepositors({ dumpFolder, bulkSize });
    const users = await exportUsers({ dumpFolder });
    const roles = await exportRoles({ dumpFolder });

    await exportInstitutions({
      depositors,
      users,
      roles,
      dataFolder,
    });

    console.log(chalk.green(`✔️ Data exported to "${chalk.underline(dataFolder)}"`));
  } catch (error) {
    await fsp.writeFile(path.join(dataFolder, 'error.log'), `${error}`, 'utf-8');
    throw error;
  }
};
