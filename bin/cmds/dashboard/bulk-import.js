const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const institutionsLib = require('../../../lib/institutions');
const spacesLib = require('../../../lib/spaces');
const dashboardsLib = require('../../../lib/dashboards');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');
const itMode = require('./interactive/bulk-import');

exports.command = 'bulk-import';
exports.desc = i18n.t('dashboard.bulkImport.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('s', {
      alias: 'spaces',
      describe: i18n.t('dashboard.bulkImport.options.spaces'),
      type: 'array',
      coerce: (array) => array.flatMap((v) => v.split(',')),
    })
    .option('ignore-missing-spaces', {
      type: 'boolean',
      describe: i18n.t('dashboard.bulkImport.options.ignoreMissingSpaces'),
    })
    .option('ignore-conflicts', {
      type: 'boolean',
      describe: i18n.t('dashboard.bulkImport.options.ignoreConflicts'),
    })
    .option('o', {
      alias: 'overwrite',
      type: 'boolean',
      describe: i18n.t('dashboard.bulkImport.options.overwrite'),
    })
    .option('f', {
      alias: 'files',
      type: 'array',
      describe: i18n.t('dashboard.bulkImport.options.files'),
    });
};

function selectDashboards(dashboards) {
  return itMode.selectMultiple({
    message: i18n.t('dashboard.bulkImport.selectDashboards'),
    default: dashboards,
    choices: dashboards.map((dashboardData) => {
      let title = dashboardData?.objects?.find?.((obj) => obj?.type === 'dashboard')?.attributes?.title;
      const tags = dashboardData?.objects
        ?.filter?.((obj) => obj.type === 'tag')
        .sort((t1, t2) => {
          const t1Name = t1?.attributes?.name?.toLowerCase();
          const t2Name = t2?.attributes?.name?.toLowerCase();
          return t1Name < t2Name ? -1 : 1;
        })
        .map((tag) => {
          const color = tag?.attributes?.color;
          const name = tag?.attributes?.name;
          return color ? chalk.hex(color)(name) : name;
        }) ?? [];

      title = `${title || chalk.grey('Untitled')} [${tags.length > 0 ? tags.join(',') : chalk.grey('no tags')}]`;

      return {
        name: title,
        value: dashboardData,
      };
    }),
  });
}

async function getAllInstitutionSpaces() {
  const spaceSuffix = await itMode.autocomplete({
    message: i18n.t('dashboard.bulkImport.selectSpaceType'),
    custom: (input) => ({ name: `{base}-${input}`, value: input }),
    choices: [
      { name: `{base} (${i18n.t('dashboard.bulkImport.ezpaarseSpace')})`, value: '' },
      { name: `{base}-publisher (${i18n.t('dashboard.bulkImport.ezcounterSpace')})`, value: 'publisher' },
    ],
  });

  let institutions;

  try {
    ({ data: institutions } = await institutionsLib.getAll());
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  return institutions
    .filter((i) => i?.space)
    .map(({ space }) => (spaceSuffix ? `${space}-${spaceSuffix}` : space));
}

async function importDashboards(opts = {}) {
  const {
    dashboards,
    space,
    argv,
  } = opts;

  const {
    verbose,
    overwrite,
  } = argv;

  let imported = 0;
  let conflicts = 0;
  let errors = 0;
  let indexPatterns;

  if (verbose) {
    console.log(`* Getting index patterns of space [${space}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    const { data: patterns } = await spacesLib.getIndexPatterns(space);
    indexPatterns = patterns.map((p) => p?.attributes?.title);
  } catch (error) {
    if (error?.response?.status === 404) {
      return { spaceNotFound: true };
    }

    console.error(formatApiError(error));
    process.exit(1);
  }

  let indexPattern = indexPatterns?.[0];

  if (indexPatterns.length > 1) {
    indexPattern = await itMode.list({
      message: i18n.t('dashboard.bulkImport.selectIndexPattern'),
      choices: indexPatterns.map((value) => ({ name: value, value })),
    });
  }

  await Promise.all(dashboards.map(async (dashboard) => {
    const dashboardTitle = dashboard?.objects?.find?.((obj) => obj?.type === 'dashboard')?.attributes?.title;

    if (verbose) {
      console.log(`* Import dashboard [${dashboardTitle}] into space [${space}] with index-pattern [${indexPattern}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await dashboardsLib.import({
        space,
        dashboard,
        indexPattern,
        force: overwrite,
      });

      const objects = {
        imported: 0,
        errors: 0,
        conflicts: 0,
      };

      data?.objects?.forEach?.((obj) => {
        if (!obj?.error) {
          objects.imported += 1;
        } else if (obj?.error?.statusCode === 409) {
          objects.conflicts += 1;
        } else {
          objects.errors += 1;
        }
      });

      console.group(dashboardTitle);
      if (objects.imported > 0) { console.log(chalk.green(i18n.t('dashboard.bulkImport.nbImported', { count: objects.imported }))); }
      if (objects.conflicts > 0) { console.log(chalk.yellow(i18n.t('dashboard.bulkImport.nbConflicts', { count: objects.conflicts }))); }
      if (objects.errors > 0) { console.log(chalk.red(i18n.t('dashboard.bulkImport.nbErrors', { count: objects.errors }))); }
      console.groupEnd();

      imported += objects.imported;
      conflicts += objects.conflicts;
      errors += objects.errors;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }
  }));

  return { imported, errors, conflicts };
}

exports.handler = async function handler(argv) {
  const {
    files,
    ignoreMissingSpaces,
    ignoreConflicts,
    verbose,
  } = argv;
  let { spaces } = argv;

  if (!files) {
    console.log(i18n.t('dashboard.bulkImport.noFiles'));
    process.exit(1);
  }

  if (verbose) {
    console.log(`* Reading ${files?.length} dashboard files`);
  }

  let dashboardFiles = await Promise.all(files.map(
    (filePath) => fs.readFile(path.resolve(filePath), 'utf8').then((content) => JSON.parse(content)),
  ));

  dashboardFiles = await selectDashboards(dashboardFiles);

  if (dashboardFiles.length === 0) {
    console.log(i18n.t('dashboard.bulkImport.noDashboardSelected'));
    process.exit(1);
  }

  if (!Array.isArray(spaces) || spaces.length === 0) {
    spaces = await getAllInstitutionSpaces();
  }

  let totalImported = 0;
  let totalErrors = 0;
  let totalConflicts = 0;
  let totalMissingSpaces = 0;
  let totalAffectedSpaces = 0;

  for (let i = 0; i < spaces.length; i += 1) {
    const space = spaces[i];

    console.log();
    console.group(chalk.bold(i18n.t('dashboard.bulkImport.space', { space })));

    const result = await importDashboards({
      dashboards: dashboardFiles,
      space,
      argv,
    });

    if (result.spaceNotFound) {
      totalMissingSpaces += 1;
      const message = i18n.t('dashboard.bulkImport.spaceNotFound');

      if (ignoreMissingSpaces) {
        console.log(chalk.blue(`[${i18n.t('global.ignored')}] ${message}`));
      } else {
        console.log(chalk.red(`[${i18n.t('global.error')}] ${message}`));
      }
    } else {
      totalImported += result.imported || 0;
      totalErrors += result.errors || 0;
      totalConflicts += result.conflicts || 0;

      if (Number.isInteger(result.imported) && result.imported > 0) {
        totalAffectedSpaces += 1;
      }
    }

    console.groupEnd();
  }

  console.log();
  console.log(chalk.green(i18n.t('dashboard.bulkImport.nbImported', { count: totalImported.toString() })));
  console.log(chalk.green(i18n.t('dashboard.bulkImport.nbAffectedSpaces', { count: totalAffectedSpaces.toString() })));

  if (totalConflicts > 0) {
    console.log(chalk.yellow(i18n.t('dashboard.bulkImport.nbConflicts', { count: totalConflicts })));
  }
  if (totalMissingSpaces > 0) {
    console.log(chalk.yellow(i18n.t('dashboard.bulkImport.nbMissingSpaces', { count: totalMissingSpaces })));
  }
  if (totalErrors > 0) {
    console.log(chalk.red(i18n.t('dashboard.bulkImport.nbErrors', { count: totalErrors })));
  }

  if (totalErrors > 0) { process.exit(1); }
  if (totalMissingSpaces > 0 && !ignoreMissingSpaces) { process.exit(1); }
  if (totalConflicts > 0 && !ignoreConflicts) { process.exit(1); }
};
