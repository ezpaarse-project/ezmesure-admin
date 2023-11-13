const { i18n } = global;

const https = require('https');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
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
    .option('o', {
      alias: 'out',
      describe: i18n.t('migrate.apply.options.out'),
      type: 'string',
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

async function importJSONL(opts) {
  const rl = await readJSONL(opts.filePath);
  const logFile = fs.createWriteStream(opts.logPath);
  const data = [];

  const multiBar = new cliProgress.MultiBar(
    {
      format: chalk.grey('    {bar} {percentage}% | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );
  const bar = multiBar.create(0, 0);

  for await (const line of rl) {
    data.push(JSON.parse(line));
    bar.setTotal(bar.total + 1);
  }

  const counters = {
    errors: 0,
    conflicts: 0,
    created: 0,
    total: 0,
  };
  const chunkSize = opts.bulkSize || data.length;
  console.log(chalk.grey(`  Using chunks of: ${chunkSize}`));
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const { data: response } = await opts.importer(chunk);

    // update counters
    counters.errors += response.errors ?? 0;
    counters.conflicts += response.conflicts ?? 0;
    counters.created += response.created ?? 0;

    const total = (response.errors ?? 0) + (response.conflicts ?? 0) + (response.created ?? 0);
    bar.increment(total);
    counters.total += total;

    // logging every item
    for (const item of (response.items ?? [])) {
      let message;
      switch (item.status) {
        case 'error':
          message = `error: ${item.message || 'Unknown error from API'}`;
          break;
        case 'conflict':
          message = `warn: ${item.message || 'Unknown warning from API'}`;
          break;

        default:
          break;
      }

      if (message) {
        logFile.write(`${message}\n${JSON.stringify(item.data ?? {})}\n\n`);
      }
    }
  }

  multiBar.stop();
  logFile.end();
  return counters;
}

async function importUsers(opts) {
  console.log(chalk.blue('i Importing users...'));
  console.group();

  const counters = await importJSONL({
    filePath: opts.filePath,
    bulkSize: opts.bulkSize,
    logPath: opts.logPath,
    importer: (chunk) => users.import(chunk),
  });

  console.log(chalk.green(`✔️ ${counters.total} users imported (${counters.created} created, ${chalk.yellow(counters.conflicts)} conflicts, ${chalk.red(counters.errors)} errors)`));
  console.groupEnd();
}

async function importInstitutions(opts) {
  console.log(chalk.blue('i Importing institutions...'));
  console.group();

  const counters = await importJSONL({
    filePath: opts.filePath,
    bulkSize: opts.bulkSize,
    logPath: opts.logPath,
    importer: (chunk) => institutions.import(chunk),
  });

  console.log(chalk.green(`✔️ ${counters.total} institutions imported (${counters.created} created, ${chalk.yellow(counters.conflicts)} conflicts, ${chalk.red(counters.errors)} errors)`));
  console.groupEnd();
}

async function importSushiEndpoints(opts) {
  console.log(chalk.blue('i Importing sushi endpoints...'));
  console.group();

  const counters = await importJSONL({
    filePath: opts.filePath,
    bulkSize: opts.bulkSize,
    logPath: opts.logPath,
    importer: (chunk) => sushiEndpoint.import(chunk),
  });

  console.log(chalk.green(`✔️ ${counters.total} sushis endpoints imported (${counters.created} created, ${chalk.yellow(counters.conflicts)} conflicts, ${chalk.red(counters.errors)} errors)`));
  console.groupEnd();
}

exports.handler = async function handler(argv) {
  const {
    exportedpath,
    bulkSize,
    insecure,
    out,
  } = argv;

  if (!fs.existsSync(exportedpath)) {
    console.error('No directory specified');
    return;
  }

  // prepare out folder
  let outFolder = path.resolve(out ?? '');
  if (!out) {
    outFolder = path.resolve(
      path.dirname(exportedpath),
      `${path.basename(exportedpath)}_imported`,
    );
  }
  await fsp.mkdir(outFolder, { recursive: true });

  if (insecure) {
    ezmesure.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  try {
    await importUsers({
      filePath: path.resolve(exportedpath, 'users.jsonl'),
      bulkSize,
      logPath: path.join(outFolder, 'user.log'),
    });
    await importSushiEndpoints({
      filePath: path.resolve(exportedpath, 'sushis.jsonl'),
      bulkSize,
      logPath: path.join(outFolder, 'sushis.log'),
    });
    await importInstitutions({
      filePath: path.resolve(exportedpath, 'institutions.jsonl'),
      bulkSize,
      logPath: path.join(outFolder, 'institutions.log'),
    });

    console.log(chalk.green('✔️ Import successful'));
  } catch (error) {
    await fsp.writeFile(path.join(outFolder, 'error.log'), `${error}`, 'utf-8');
    throw error;
  }
};
