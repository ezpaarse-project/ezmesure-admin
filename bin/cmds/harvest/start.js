const { i18n } = global;

const inquirer = require('inquirer');
const chalk = require('chalk');
const { table } = require('table');

const harvestLib = require('../../../lib/harvest');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'start [harvestId]';
exports.desc = i18n.t('harvest.start.description');
exports.builder = (yargs) => yargs
  .positional('harvestId', {
    describe: i18n.t('harvest.status.options.harvestId'),
    type: 'string',
  })
  .option('restart-all', {
    describe: i18n.t('harvest.start.options.restartAll'),
    type: 'boolean',
    group: 'Start parameters :',
  })
  .option('y', {
    alias: 'yes',
    describe: i18n.t('harvest.start.options.yes'),
    type: 'boolean',
  })
  .option('format', {
    type: 'string',
    choices: ['ndjson'],
    describe: i18n.t('harvest.status.options.format'),
  });

const printJobs = (jobs, argv) => {
  const { format } = argv;

  if (format === 'ndjson') {
    jobs.forEach((j) => console.log(JSON.stringify(j)));
    return;
  }

  console.log(
    table([
      [
        chalk.bold(i18n.t('harvest.status.jobId')),
        chalk.bold(i18n.t('harvest.status.credentialsId')),
        chalk.bold(i18n.t('harvest.status.reportTypes')),
        chalk.bold(i18n.t('harvest.status.index')),
        chalk.bold(i18n.t('harvest.status.jobStatus')),
      ],
      ...jobs.map((j) => {
        let { status } = j;
        switch (status) {
          case 'finished':
            status = chalk.green(status);
            break;
          case 'waiting':
            status = chalk.grey(status);
            break;
          case 'running':
          case 'delayed':
            status = chalk.yellow(status);
            break;

          default:
            status = chalk.red(status);
            break;
        }

        return [
          j.id,
          j.credentialsId,
          j.reportType,
          j.index,
          status,
        ];
      }),
    ]),
  );
};

function readAllStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

exports.handler = async function handler(argv) {
  const {
    harvestId,
    restartAll,
    verbose,
    yes,
    $0: scriptName,
  } = argv;

  let sessions = [];
  if (harvestId) {
    sessions = [{ harvestId }];
  }

  // Parse stdin if needed
  if (!process.stdin.isTTY) {
    try {
      const data = JSON.parse(await readAllStdin());
      sessions = Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error(`Couldn't read from stdin: ${error}`);
      process.exit(0);
    }
  }

  for (const params of sessions) {
    const hid = params.harvestId || params.id;
    if (process.stdin.isTTY) {
      const confirm = await inquirer.prompt(
        {
          type: 'confirm',
          name: 'value',
          message: i18n.t(
            'harvest.start.askConfirmation',
            {
              id: chalk.underline(hid),
              instance: chalk.underline(config.ezmesure.baseUrl),
            },
          ),
          default: true,
        },
        { value: yes },
      );
      if (!confirm.value) {
        process.exit(0);
      }
    }

    if (verbose) {
      console.log(`Start harvest session ${hid} from ${config.ezmesure.baseUrl}`);
    }

    let jobs;
    try {
      jobs = (await harvestLib.start(hid, { restartAll })).data;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    printJobs(jobs, argv);

    console.log(chalk.green(i18n.t('harvest.start.success', { id: hid, jobs: jobs.length })));
    console.log(chalk.blue(i18n.t('harvest.start.runStatusCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status ${hid}`));
    console.log(chalk.blue(i18n.t('harvest.start.runJobsCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status ${hid} --jobs`));
    console.log(chalk.blue(i18n.t('harvest.start.runWatchCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status ${hid} --watch`));
  }
};
