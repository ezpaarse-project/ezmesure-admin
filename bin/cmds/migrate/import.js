const { i18n } = global;

const https = require('https');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const cliProgress = require('cli-progress');
const chalk = require('chalk');

const users = require('../../../lib/users');
const ezmesure = require('../../../lib/app/ezmesure');
const institutions = require('../../../lib/institutions');
const sushiEndpoint = require('../../../lib/sushiEndpoints');

exports.command = 'import <exported path>';
exports.desc = i18n.t('import.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('b', {
      alias: 'bulk-size',
      describe: i18n.t('import.options.bulkSize'),
      type: 'number',
      default: 15,
    })
    .option('k', {
      alias: 'insecure',
      describe: i18n.t('import.options.insecure'),
      type: 'boolean',
    });
};

async function readJSONL(filePath) {
  let readStream;

  try {
    readStream = await fs.createReadStream(filePath);
  } catch (err) {
    console.error(`Cannot readstream ${filePath}`);
    process.exit(1);
  }

  return readline.createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });
}

// TODO show errors !

async function importUsers(filePath, bulkSize) {
  const rl = await readJSONL(filePath);
  let data = [];
  let i = 0;

  console.log(chalk.blue('i Importing users...'));
  console.group();

  const bar = new cliProgress.SingleBar(
    {
      format: chalk.grey('    {bar} {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );
  bar.start(0, 0);

  for await (const line of rl) {
    i += 1;
    data.push(JSON.parse(line));
    bar.setTotal(bar.total + 1);
    if (i === bulkSize) {
      // import users
      await users.import(data);
      bar.increment(data.length);
      i = 0;
      data = [];
    }
  }

  if (data.length > 0) {
    await users.import(data);
    bar.increment(data.length);
  }

  bar.stop();
  console.log(chalk.green(`✔️ ${bar.total} users imported`));
  console.groupEnd();
}

async function importInstitutions(filePath, bulkSize) {
  const rl = await readJSONL(filePath);
  let data = [];
  let i = 0;

  console.log(chalk.blue('i Importing institutions...'));
  console.group();

  const bar = new cliProgress.SingleBar(
    {
      format: chalk.grey('    {bar} {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );
  bar.start(0, 0);

  for await (const line of rl) {
    i += 1;
    data.push(JSON.parse(line));
    bar.setTotal(bar.total + 1);
    if (i === bulkSize) {
      // import institutions, repo, space, members
      await institutions.import(data);
      bar.increment(data.length);
      i = 0;
      data = [];
    }
  }

  if (data.length > 0) {
    await institutions.import(data);
    bar.increment(data.length);
  }

  bar.stop();
  console.log(chalk.green(`✔️ ${bar.total} institutions, repositories, spaces and memberships imported`));
  console.groupEnd();
}

async function importSushiEndpoints(filePath, bulkSize) {
  const rl = await readJSONL(filePath);
  let data = [];
  let i = 0;

  console.log(chalk.blue('i Importing sushi endpoints...'));
  console.group();

  const bar = new cliProgress.SingleBar(
    {
      format: chalk.grey('    {bar} {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );
  bar.start(0, 0);

  for await (const line of rl) {
    i += 1;
    data.push(JSON.parse(line));
    bar.setTotal(bar.total + 1);
    if (i === bulkSize) {
      // import sushiEndpoint
      await sushiEndpoint.import(data);
      bar.increment(data.length);
      i = 0;
      data = [];
    }
  }

  if (data.length > 0) {
    await sushiEndpoint.import(data);
    bar.increment(data.length);
  }

  bar.stop();
  console.log(chalk.green(`✔️ ${bar.total} sushi endpoints imported`));
  console.groupEnd();
}

exports.handler = async function handler(argv) {
  const { exportedpath, bulkSize, insecure } = argv;

  if (!fs.existsSync(exportedpath)) {
    console.error('No directory specified');
    return;
  }

  if (insecure) {
    ezmesure.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  const filePathUsers = path.resolve(exportedpath, 'users.jsonl');
  const filePathSushiEndpoints = path.resolve(exportedpath, 'sushis.jsonl');
  const filePathInstitutions = path.resolve(exportedpath, 'institutions.jsonl');

  try {
    await importUsers(filePathUsers, bulkSize);
  } catch (error) {
    console.error('error users');
    console.error(error.response.data);
    throw error;
  }

  try {
    await importSushiEndpoints(filePathSushiEndpoints, bulkSize);
  } catch (error) {
    console.error('error sushiEndpoint');
    console.error(error.response.data);
    throw error;
  }

  try {
    await importInstitutions(filePathInstitutions, bulkSize);
  } catch (error) {
    console.error('error institution');
    console.error(error.response.data);
    throw error;
  }

  console.log(chalk.green('✔️ Import successful'));
};
