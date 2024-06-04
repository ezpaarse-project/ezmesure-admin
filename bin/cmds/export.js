const { i18n } = global;

const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');

const cliProgress = require('cli-progress');
const chalk = require('chalk');
const { format } = require('date-fns');

const usersLib = require('../../lib/users');
const sushiEndpointsLib = require('../../lib/sushiEndpoints');
const institutionsLib = require('../../lib/institutions');
const repositoriesLib = require('../../lib/repositories');
const spacesLib = require('../../lib/spaces');

exports.command = 'export';
exports.desc = i18n.t('export.description');
exports.builder = (yargs) => yargs
  .option('o', {
    alias: 'out',
    describe: i18n.t('export.options.out'),
    type: 'string',
    default: format(new Date(), 'yyyy-MM-dd'),
  });

const exportData = async (opts) => {
  console.log(chalk.blue(i18n.t('export.going', { type: opts.type })));
  console.group();
  const { data } = await opts.fetch();

  console.log(chalk.grey(i18n.t('export.file', { type: opts.type })));
  const fileStream = fs.createWriteStream(opts.outFile);

  const bar = new cliProgress.SingleBar(
    {
      format: chalk.grey('    {bar} {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );
  bar.start(data.length, 0);

  let count = 0;
  data.forEach((item) => {
    if (!opts.filter || opts.filter(item)) {
      fileStream.write(`${JSON.stringify(item)}\n`);
      count += 1;
    }

    bar.increment();
  });

  fileStream.end();
  bar.stop();
  console.log(chalk.green(
    i18n.t(
      'export.ok',
      {
        count,
        type: opts.type,
        out: chalk.underline(fileStream.path),
      },
    ),
  ));
  console.groupEnd();
};

const sortParentsInstitutions = (data, institution) => {
  if (!institution.parentInstitutionId) {
    return;
  }

  const index = data.findIndex((i) => i.id === institution.id);
  const parentIndex = data.findIndex((i) => i.id === institution.parentInstitutionId);
  if (parentIndex < 0) {
    throw new Error(`Parent institution of ${institution.id} not found`);
  }
  if (index > parentIndex) {
    return;
  }

  data.splice(index, 1);
  data.splice(parentIndex, 0, institution);
};

exports.handler = async function handler(argv) {
  const { out } = argv;

  const dataFolder = path.resolve(out);
  await fsp.mkdir(dataFolder, { recursive: true });

  try {
    await exportData({
      type: 'users',
      outFile: path.join(dataFolder, 'users.jsonl'),
      fetch: () => usersLib.getAll({ source: '*' }),
      filter: (item) => item.username !== 'ezmesure-admin',
    });

    await exportData({
      type: 'sushis',
      outFile: path.join(dataFolder, 'sushis.jsonl'),
      fetch: () => sushiEndpointsLib.getAll(),
    });

    await exportData({
      type: 'institutions',
      outFile: path.join(dataFolder, 'institutions.jsonl'),
      fetch: async () => {
        const { data, ...resp } = await institutionsLib.getAll({ include: ['sushiCredentials', 'memberships'] });

        console.log(chalk.gray(i18n.t('export.institutionSort')));
        // ensuring that parent institutions are always before their children
        // working with a copy of the data to avoid mistakes while iterating over it
        [...data].forEach((institution) => sortParentsInstitutions(data, institution));

        return { data, ...resp };
      },
    });

    await exportData({
      type: 'repositories',
      outFile: path.join(dataFolder, 'repositories.jsonl'),
      fetch: () => repositoriesLib.getAll({ include: ['institutions', 'permissions'] }),
    });

    await exportData({
      type: 'spaces',
      outFile: path.join(dataFolder, 'spaces.jsonl'),
      fetch: () => spacesLib.getAll({ include: ['permissions'] }),
    });

    console.log(chalk.green(i18n.t('export.dataOk', { out: chalk.underline(dataFolder) })));
  } catch (error) {
    const now = new Date();
    console.log(chalk.grey(i18n.t('export.file', { type: 'error logs' })));
    await fsp.writeFile(path.join(dataFolder, 'error.log'), `${now.toISOString()} error: ${error}`, 'utf-8');
    throw error;
  }
};
