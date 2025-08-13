const { i18n } = global;

const { setTimeout } = require('node:timers/promises');

const inquirer = require('inquirer');
const chalk = require('chalk');

const harvestLib = require('../../../lib/harvest');
const { config } = require('../../../lib/app/config');
const { formatApiError, readAllStdinAsJson } = require('../../../lib/utils');

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

async function waitForComplete(session, verbose, interval = 500) {
  const { data: start } = await harvestLib.getStartStatus(session.id);
  if (verbose) {
    console.log(chalk.grey(`  Session is ${chalk.bold(start.status)}`));
  }

  if (start.status !== 'stopping' || start.error) {
    return start;
  }

  await setTimeout(interval);
  return waitForComplete(session, verbose, interval);
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

  const stdinSessions = await readAllStdinAsJson();
  if (stdinSessions) {
    sessions = Array.isArray(stdinSessions) ? stdinSessions : [stdinSessions];
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

    let start;
    try {
      await harvestLib.stop(hid);

      console.log(chalk.blue(i18n.t('harvest.stop.started')));

      start = await waitForComplete({ id: hid }, verbose);
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    if (start.error) {
      console.log(chalk.red(i18n.t('harvest.stop.error')));
      console.log(start.error);
      return;
    }

    console.log(chalk.green(i18n.t('harvest.stop.success', { id: hid })));
    console.log(chalk.blue(i18n.t('harvest.start.runStatusCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status "${hid}"`));
    console.log(chalk.blue(i18n.t('harvest.start.runJobsCommand')));
    console.log(chalk.blue(`\t${scriptName} harvest status "${hid}" --jobs`));
  }
};
