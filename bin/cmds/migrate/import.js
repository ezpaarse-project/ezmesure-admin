const { i18n } = global;

const https = require('https');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const chalk = require('chalk');
const users = require('../../../lib/users');
const ezmesure = require('../../../lib/app/ezmesure');
const institutions = require('../../../lib/institutions');
const sushiEndpoint = require('../../../lib/sushiEndpoints');

exports.command = 'import';
exports.desc = i18n.t('import.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('d', {
      alias: 'directory',
      describe: i18n.t('import.import.options.directory'),
      type: 'string',
    })
    .option('b', {
      alias: 'bulk-size',
      describe: i18n.t('migrate.import.options.bulkSize'),
      type: 'number',
      default: 15,
    })
    .option('k', {
      alias: 'insecure',
      describe: i18n.t('migrate.import.options.insecure'),
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

// TODO
async function importUsers(filePath, bulkSize) {
  const rl = await readJSONL(filePath);
  let data = [];
  let i = 0;

  for await (const line of rl) {
    i += 1;
    data.push(JSON.parse(line));
    if (i === bulkSize) {
      console.log(chalk.blue(`${bulkSize} users imported`));
      // import users and memberships
      await users.import(data);
      i = 0;
      data = [];
    }
  }

  if (data.length > 0) {
    console.log(chalk.blue(`${data.length} users imported`));
    await users.import(data);
  }
  console.log(chalk.green('users, memberships are imported successfully'));
}

// TODO
async function importInstitutions(filePath, bulkSize) {
  const rl = await readJSONL(filePath);
  let data = [];
  let i = 0;

  for await (const line of rl) {
    i += 1;
    const parsedLine = JSON.parse(line);
    delete parsedLine.memberships;
    data.push(parsedLine);
    if (i === bulkSize) {
      // import institutions, repo, space
      console.log(chalk.blue(`${bulkSize} institutions imported`));
      await institutions.import(data);
      i = 0;
      data = [];
    }
  }

  if (data.length > 0) {
    console.log(chalk.blue(`${data.length} institutions imported`));
    await institutions.import(data);
  }

  console.log(chalk.green('Institutions, repositories, spaces are imported successfully'));
}

async function importSushiEndpoints(filePath, bulkSize) {
  const rl = await readJSONL(filePath);
  let data = [];
  let i = 0;

  for await (const line of rl) {
    i += 1;
    data.push(JSON.parse(line));
    if (i === bulkSize) {
      // import sushiEndpoint
      console.log(chalk.blue(`${bulkSize} sushiEndpoints imported`));
      await sushiEndpoint.import(data);
      i = 0;
      data = [];
    }
  }

  if (data.length > 0) {
    console.log(chalk.blue(`${data.length} sushiEndpoints imported`));
    await sushiEndpoint.import(data);
  }
  console.log(chalk.green('sushi endpoint are imported successfully'));
}

exports.handler = async function handler(argv) {
  const { directory, bulkSize, insecure } = argv;

  if (!fs.existsSync(directory)) {
    console.error('No directory specified');
    return;
  }

  if (insecure) {
    ezmesure.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  const filePathInstitutions = path.resolve(directory, 'institutions.jsonl');
  const filePathUsers = path.resolve(directory, 'users.jsonl');
  const filePathSushiEndpoints = path.resolve(directory, 'sushis.jsonl');

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

  try {
    await importUsers(filePathUsers, bulkSize);
  } catch (error) {
    console.error('error users');
    console.error(error.response.data);
    throw error;
  }

  console.log(chalk.green('all are imported successfully'));
};
