const { i18n } = global;

const https = require('node:https');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const readline = require('node:readline');

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
    .option('out', {
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
    })
    .option('o', {
      alias: 'overwrite',
      describe: i18n.t('transfer.options.overwrite'),
      type: 'boolean',
    });
};

/**
 * Read JSONL file line by line, parse content and returns it
 *
 * @param {string} filePath The path to the JSONL file
 *
 * @returns {Promise<Object[]>} data parsed from file
 */
async function readJSONL(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const data = [];
  for await (const line of rl) {
    data.push(JSON.parse(line));
  }
  return data;
}

/**
 * Import JSONL file into ezMESURE Reloaded
 *
 * @param {Object} opts Various options
 * @param {string} opts.filePath The path of the JSONL file
 * @param {number} opts.bulkSize The size of chunks
 * @param {number} opts.overwrite Should overwrite
 * @param {string} opts.logPath The path to the log file
 * @param {(chunk: Object) => Promise<any>} opts.importer The importer
 */
async function importJSONL(opts) {
  const now = new Date();
  console.log(chalk.grey(i18n.t('import.file', { type: 'logs' })));
  const logFile = fs.createWriteStream(opts.logPath);

  const multiBar = new cliProgress.MultiBar(
    {
      format: chalk.grey('    {bar} {percentage}% | ETA: {eta_formatted} | {value}/{total}'),
    },
    cliProgress.Presets.shades_classic,
  );
  const bar = multiBar.create(0, 0);

  const data = await readJSONL(opts.filePath);
  bar.setTotal(data.length);

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

/**
 * Import users into ezMESURE Reloaded
 *
 * @param {Object} opts Various options
 * @param {string} opts.inFolder The in folder
 * @param {string} opts.outFolder The out folder
 * @param {number} opts.bulkSize The size of chunks
 * @param {number} opts.overwrite Should overwrite
 */
async function importUsers(opts) {
  console.log(chalk.blue(i18n.t('import.users.going')));
  console.group();

  const counters = await importJSONL({
    filePath: path.resolve(opts.inFolder, 'users.jsonl'),
    bulkSize: opts.bulkSize,
    logPath: path.join(opts.outFolder, 'user.log'),
    importer: (chunks) => users.import(chunks, { params: { overwrite: opts.overwrite } }),
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

/**
 * Import institutions into ezMESURE Reloaded
 *
 * @param {Object} opts Various options
 * @param {string} opts.inFolder The in folder
 * @param {string} opts.outFolder The out folder
 * @param {number} opts.bulkSize The size of chunks
 * @param {number} opts.overwrite Should overwrite
 */
async function importInstitutions(opts) {
  console.log(chalk.blue(i18n.t('import.institutions.going')));
  console.group();

  const counters = await importJSONL({
    filePath: path.resolve(opts.inFolder, 'institutions.jsonl'),
    bulkSize: opts.bulkSize,
    logPath: path.join(opts.outFolder, 'institutions.log'),
    importer: (chunks) => institutions.import(chunks, { params: { overwrite: opts.overwrite } }),
  });

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

/**
 * Import endpoints into ezMESURE Reloaded
 *
 * @param {Object} opts Various options
 * @param {string} opts.inFolder The in folder
 * @param {string} opts.outFolder The out folder
 * @param {number} opts.bulkSize The size of chunks
 * @param {number} opts.overwrite Should overwrite
 */
async function importSushiEndpoints(opts) {
  console.log(chalk.blue(i18n.t('import.sushi.going')));
  console.group();

  const counters = await importJSONL({
    filePath: path.resolve(opts.inFolder, 'sushis.jsonl'),
    bulkSize: opts.bulkSize,
    logPath: path.join(opts.outFolder, 'sushis.log'),
    importer: (chunks) => sushiEndpoint.import(chunks, { params: { overwrite: opts.overwrite } }),
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
    overwrite,
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
  if (overwrite) {
    console.log('Importing in overwrite mode');
  }
  const confirm = await inquirer.prompt(
    {
      type: 'confirm',
      name: 'value',
      message: i18n.t(
        'import.askConfirmation',
        {
          out: chalk.underline(exportedpath),
          instance: chalk.underline(ezmesure.defaults.baseURL),
        },
      ),
      default: true,
    },
    { value: yes },
  );
  if (!confirm.value) {
    process.exit(0);
  }

  // ensure out folder
  await fsp.mkdir(outFolder, { recursive: true });

  if (insecure) {
    ezmesure.defaults.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  }

  try {
    await importUsers({
      inFolder: exportedpath,
      outFolder,
      bulkSize,
      overwrite,
    });
    await importSushiEndpoints({
      inFolder: exportedpath,
      outFolder,
      bulkSize,
      overwrite,
    });
    await importInstitutions({
      inFolder: exportedpath,
      outFolder,
      bulkSize,
      overwrite,
    });

    console.log(chalk.green(i18n.t('import.ok', { out: chalk.underline(outFolder) })));
  } catch (error) {
    const now = new Date();
    console.log(chalk.grey(i18n.t('import.file', { type: 'error logs' })));
    await fsp.writeFile(path.join(outFolder, 'error.log'), `${now.toISOString()} error: ${error}`, 'utf-8');
    throw error;
  }
};
