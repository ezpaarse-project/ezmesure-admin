const { i18n } = global;

const https = require('https');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const readline = require('readline');

const cliProgress = require('cli-progress');
const chalk = require('chalk');
const inquirer = require('inquirer');

const users = require('../../lib/users');
const ezmesure = require('../../lib/app/ezmesure');
const institutions = require('../../lib/institutions');
const sushiEndpoint = require('../../lib/sushiEndpoints');

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
      describe: i18n.t('import.options.out'),
      type: 'string',
    })
    .option('k', {
      alias: 'insecure',
      describe: i18n.t('import.options.insecure'),
      type: 'boolean',
    })
    .option('y', {
      alias: 'yes',
      describe: i18n.t('import.options.yes'),
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
  const now = new Date();
  const rl = await readJSONL(opts.filePath);
  console.log(chalk.grey(i18n.t('import.file', { type: 'logs' })));
  const logFile = fs.createWriteStream(opts.logPath);
  const data = [];

  const multiBar = new cliProgress.MultiBar(
    {
      format: chalk.grey('    {bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}'),
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
  console.log(chalk.grey(i18n.t('import.chunks', { chunkSize })));
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
          message = `error: ${item.message || i18n.t('import.unknownError')}`;
          break;
        case 'conflict':
          message = `warn: ${item.message || i18n.t('import.unknownWarn')}`;
          break;

        default:
          break;
      }

      if (message) {
        logFile.write(`${now.toISOString()} ${message}\n${JSON.stringify(item.data ?? {})}\n\n`);
      }
    }
  }

  multiBar.stop();
  logFile.end();
  return counters;
}

async function importUsers(opts) {
  console.log(chalk.blue(i18n.t('import.users.going')));
  console.group();

  const counters = await importJSONL({
    filePath: opts.filePath,
    bulkSize: opts.bulkSize,
    logPath: opts.logPath,
    importer: (chunk) => users.import(chunk),
  });

  console.log(
    chalk.green(i18n.t(
      'import.users.ok',
      {
        total: `${counters.total}`,
        created: `${counters.created}`,
        conflicts: chalk.yellow(counters.conflicts),
        errors: chalk.red(counters.errors),
      },
    )),
  );
  console.groupEnd();
}

async function importInstitutions(opts) {
  console.log(chalk.blue(i18n.t('import.institutions.going')));
  console.group();

  const counters = await importJSONL({
    filePath: opts.filePath,
    bulkSize: opts.bulkSize,
    logPath: opts.logPath,
    importer: (chunk) => institutions.import(chunk),
  });

  console.log(counters);
  console.log(
    chalk.green(i18n.t(
      'import.institutions.ok',
      {
        total: `${counters.total}`,
        created: `${counters.created}`,
        conflicts: chalk.yellow(counters.conflicts),
        errors: chalk.red(counters.errors),
      },
    )),
  );
  console.groupEnd();
}

async function importSushiEndpoints(opts) {
  console.log(chalk.blue(i18n.t('import.sushi.going')));
  console.group();

  const counters = await importJSONL({
    filePath: opts.filePath,
    bulkSize: opts.bulkSize,
    logPath: opts.logPath,
    importer: (chunk) => sushiEndpoint.import(chunk),
  });

  console.log(
    chalk.green(i18n.t(
      'import.sushi.ok',
      {
        total: `${counters.total}`,
        created: `${counters.created}`,
        conflicts: chalk.yellow(counters.conflicts),
        errors: chalk.red(counters.errors),
      },
    )),
  );
  console.groupEnd();
}

exports.handler = async function handler(argv) {
  const {
    exportedpath,
    bulkSize,
    insecure,
    out,
    yes,
  } = argv;

  if (!fs.existsSync(exportedpath)) {
    throw new Error(i18n.t('import.noInDir'));
  }

  // prepare out folder
  let outFolder = path.resolve(out ?? '');
  if (!out) {
    outFolder = path.resolve(
      path.dirname(exportedpath),
      `${path.basename(exportedpath)}_imported`,
    );
  }

  // ask for confirmation
  if (!yes) {
    const confirm = await inquirer.prompt({
      type: 'confirm',
      name: 'value',
      message: i18n.t(
        'import.askConfirmation',
        {
          out: chalk.underline(outFolder),
          instance: chalk.underline(ezmesure.defaults.baseURL),
        },
      ),
      default: true,
    });
    if (!confirm.value) {
      process.exit(0);
    }
  }

  // ensure out folder
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

    console.log(chalk.green(`✔️ Import successful, logs are available in ${chalk.underline(outFolder)}`));
  } catch (error) {
    const now = new Date();
    console.log(chalk.grey(i18n.t('import.file', { type: 'error logs' })));
    await fsp.writeFile(path.join(outFolder, 'error.log'), `${now.toISOString()} error: ${error}`, 'utf-8');
    throw error;
  }
};
