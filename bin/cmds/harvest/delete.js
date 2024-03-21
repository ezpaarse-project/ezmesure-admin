const { i18n } = global;

const inquirer = require('inquirer');
const chalk = require('chalk');

const harvestLib = require('../../../lib/harvest');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'delete <harvestId>';
exports.desc = i18n.t('harvest.delete.description');
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

exports.handler = async function handler(argv) {
  const {
    harvestId,
    verbose,
    yes,
    $0: scriptName,
  } = argv;

  const confirm = await inquirer.prompt(
    {
      type: 'confirm',
      name: 'value',
      message: i18n.t(
        'harvest.delete.askConfirmation',
        {
          id: chalk.underline(harvestId),
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
    console.log(`Deleting harvest session ${harvestId} from ${config.ezmesure.baseUrl}`);
  }

  try {
    await harvestLib.delete(harvestId);
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  console.log(chalk.green(i18n.t('harvest.delete.success', { id: harvestId })));
  console.log(chalk.blue(i18n.t('harvest.start.runStatusCommand')));
  console.log(chalk.blue(`\t${scriptName} harvest status ${harvestId}`));
  console.log(chalk.blue(i18n.t('harvest.start.runJobsCommand')));
  console.log(chalk.blue(`\t${scriptName} harvest status ${harvestId} --jobs`));
};
