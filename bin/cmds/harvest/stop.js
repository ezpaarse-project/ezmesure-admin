const { i18n } = global;

const inquirer = require('inquirer');
const chalk = require('chalk');

const harvestLib = require('../../../lib/harvest');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'stop <harvestId>';
exports.desc = i18n.t('harvest.stop.description');
exports.builder = (yargs) => yargs
  .positional('harvestId', {
    describe: i18n.t('harvest.status.options.harvestId'),
    type: 'string',
  })
  .option('y', {
    alias: 'yes',
    describe: i18n.t('harvest.start.options.yes'),
    type: 'boolean',
  });

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
    const confirm = await inquirer.prompt(
      {
        type: 'confirm',
        name: 'value',
        message: i18n.t(
          'harvest.stop.askConfirmation',
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

    if (verbose) {
      console.log(`Stopping harvest session ${hid} from ${config.ezmesure.baseUrl}`);
    }

    try {
      await harvestLib.stop(hid);
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    console.log(chalk.green(i18n.t('harvest.stop.success', { id: hid })));
    console.log(chalk.blue(i18n.t('harvest.start.runStatusCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status ${hid}`));
    console.log(chalk.blue(i18n.t('harvest.start.runJobsCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status ${hid} --jobs`));
  }
};
