const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const JSZip = require('jszip');

const spacesLib = require('../../../lib/spaces');
const kibana = require('../../../lib/kibana');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');
const itMode = require('./interactive/bulk-import');

exports.command = 'bulk-delete';
exports.desc = i18n.t('dashboard.bulkDelete.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('dashboardIds', {
      alias: 'd',
      describe: i18n.t('dashboard.bulkDelete.options.dashboardIds'),
      type: 'array',
      coerce: (array) => array.flatMap((v) => v.split(',')),
    })
    .option('s', {
      alias: 'spaces',
      describe: i18n.t('dashboard.bulkDelete.options.spaces'),
      type: 'array',
      coerce: (array) => array.flatMap((v) => v.split(',')),
    })
    .option('ignore-missing-spaces', {
      type: 'boolean',
      describe: i18n.t('dashboard.bulkDelete.options.ignoreMissingSpaces'),
    })
    .option('p', {
      alias: 'id-prefix',
      type: 'string',
      default: 'generic:',
      describe: i18n.t('dashboard.bulkDelete.options.idPrefix'),
    })
    .option('f', {
      alias: 'files',
      type: 'array',
      describe: i18n.t('dashboard.bulkDelete.options.files'),
    });
};

function selectDashboards(dashboards) {
  return itMode.selectMultiple({
    message: i18n.t('dashboard.bulkDelete.selectDashboards'),
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

async function getAllSpacesByType() {
  const spaceType = await itMode.list({
    message: i18n.t('dashboard.bulkDelete.selectSpaceType'),
    default: 'ezpaarse',
    choices: [
      { name: i18n.t('dashboard.bulkDelete.ezpaarseSpace'), value: 'ezpaarse' },
      { name: i18n.t('dashboard.bulkDelete.ezcounterSpace'), value: 'counter5' },
    ],
  });

  let spaces;

  try {
    ({ data: spaces } = await spacesLib.getAll({ type: spaceType }));
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  return spaces;
}

async function deleteDashboards(opts = {}) {
  const {
    dashboards,
    space,
    argv,
  } = opts;

  const {
    verbose,
    overwrite,
    idPrefix,
  } = argv;

  let deleted = 0;
  let errors = 0;
  let notFound = 0;

  if (verbose) {
    console.log(`* Getting space [${space?.id}] from ${config.ezmesure.baseUrl}`);
  }

  try {
    await kibana.spaces.get({ id: space?.id });
  } catch (error) {
    if (error?.response?.status === 404) {
      return { spaceNotFound: true };
    }

    console.error(formatApiError(error));
    process.exit(1);
  }

  await Promise.all(dashboards.map(async (dashboard) => {
    const dashboardTitle = dashboard?.objects?.find?.((obj) => obj?.type === 'dashboard')?.attributes?.title;
    let dashboardId = dashboard?.objects?.find?.((obj) => obj?.type === 'dashboard')?.id;

    if (idPrefix && dashboardId && !dashboardId.startsWith(idPrefix)) {
      dashboardId = `${idPrefix}${dashboardId}`;
    }

    if (verbose) {
      console.log(`* Removing dashboard [${dashboardTitle}] of space [${space?.id}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      await kibana.savedObjects.delete({
        space: space?.id,
        type: 'dashboard',
        id: dashboardId,
        force: overwrite,
      });

      deleted += 1;
      console.log(`${chalk.green(`[Deleted] ${dashboardTitle}`)}`);
    } catch (error) {
      if (error?.response?.status === 404) {
        notFound += 1;
        console.log(`${chalk.yellow(`[Not found] ${dashboardTitle}`)}`);
      } else {
        errors += 1;
        console.log(`${chalk.red(`[Failed] ${dashboardTitle}`)}`);
        console.error(formatApiError(error));
      }
    }
  }));

  return { deleted, notFound, errors };
}

async function getRemoteTemplates() {
  const { data } = await axios({
    method: 'get',
    url: 'https://github.com/ezpaarse-project/ezmesure-templates/archive/refs/heads/master.zip',
    responseType: 'arraybuffer',
  });

  const dirs = new Map();
  const zip = new JSZip();
  await zip.loadAsync(data);

  // We loop over all uncompressed zip entries
  zip.forEach((relativePath, entry) => {
    if (path.extname(relativePath).toLowerCase() !== '.json') {
      return;
    }
    const dirPath = path.dirname(relativePath);

    if (!dirs.has(dirPath)) {
      dirs.set(dirPath, []);
    }

    // A promise that will resolve with the file content, decompressed and parsed into JSON
    const filePromise = entry.async('string').then((content) => {
      try {
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    });

    dirs.get(dirPath).push(filePromise);
  });

  // Wait for file promises to resolve and changes the Map() into an object
  // with the dir path and the resolved file contents
  return Promise.all(
    Array
      .from(dirs.entries())
      .map(async ([dirPath, filePromises]) => ({
        path: dirPath,
        files: await Promise.all(filePromises),
      })),
  );
}

exports.handler = async function handler(argv) {
  const {
    files,
    ignoreMissingSpaces,
    dashboardIds,
    verbose,
  } = argv;
  let { spaces } = argv;

  let dashboardFiles;

  if (files) {
    if (verbose) {
      console.log(`* Reading ${files?.length} dashboard files`);
    }

    dashboardFiles = await Promise.all(files.map(
      (filePath) => fs.readFile(path.resolve(filePath), 'utf8').then((content) => JSON.parse(content)),
    ));
  } else if (dashboardIds.length > 0) {
    dashboardFiles = dashboardIds.map((id) => ({ objects: [{ type: 'dashboard', id, attributes: { title: id } }] }));
  } else {
    console.log('Downloading remote templates from ezpaarse-project/ezmesure-templates...');

    const dirs = await getRemoteTemplates();

    dashboardFiles = await itMode.autocomplete({
      message: i18n.t('dashboard.bulkDelete.selectTemplateDir'),
      choices: dirs.map((dir) => ({ name: dir.path, value: dir.files })),
    });
  }

  dashboardFiles = await selectDashboards(dashboardFiles);

  if (dashboardFiles.length === 0) {
    console.log(i18n.t('dashboard.bulkDelete.noDashboardsSelected'));
    process.exit(1);
  }

  if (!Array.isArray(spaces) || spaces.length === 0) {
    spaces = await getAllSpacesByType();
  } else {
    spaces = spaces.map((id) => ({ id }));
  }

  let totalDeleted = 0;
  let totalErrors = 0;
  let totalMissingSpaces = 0;
  let totalAffectedSpaces = 0;

  for (let i = 0; i < spaces.length; i += 1) {
    const space = spaces[i];

    console.log();
    console.group(chalk.bold(i18n.t('dashboard.bulkDelete.space', { name: space?.name || '', id: space?.id })));

    const result = await deleteDashboards({
      dashboards: dashboardFiles,
      space,
      argv,
    });

    if (result.spaceNotFound) {
      totalMissingSpaces += 1;
      const message = i18n.t('dashboard.bulkDelete.spaceNotFound');

      if (ignoreMissingSpaces) {
        console.log(chalk.blue(`[${i18n.t('global.ignored')}] ${message}`));
      } else {
        console.log(chalk.red(`[${i18n.t('global.error')}] ${message}`));
      }
    } else {
      totalDeleted += result.deleted || 0;
      totalErrors += result.errors || 0;

      if (Number.isInteger(result.deleted) && result.deleted > 0) {
        totalAffectedSpaces += 1;
      }
    }

    console.groupEnd();
  }

  console.log();
  console.log(chalk.green(i18n.t('dashboard.bulkDelete.nbDeleted', { count: totalDeleted.toString() })));
  console.log(chalk.green(i18n.t('dashboard.bulkDelete.nbAffectedSpaces', { count: totalAffectedSpaces.toString() })));

  if (totalMissingSpaces > 0) {
    console.log(chalk.yellow(i18n.t('dashboard.bulkDelete.nbMissingSpaces', { count: totalMissingSpaces })));
  }
  if (totalErrors > 0) {
    console.log(chalk.red(i18n.t('dashboard.bulkDelete.nbErrors', { count: totalErrors })));
  }

  if (totalErrors > 0) { process.exit(1); }
  if (totalMissingSpaces > 0 && !ignoreMissingSpaces) { process.exit(1); }
};
