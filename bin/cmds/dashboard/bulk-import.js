const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const JSZip = require('jszip');

const spacesLib = require('../../../lib/spaces');
const kibana = require('../../../lib/kibana');
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
    .option('p', {
      alias: 'id-prefix',
      type: 'string',
      default: 'generic:',
      describe: i18n.t('dashboard.bulkImport.options.idPrefix'),
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

async function getAllSpacesByType() {
  const spaceType = await itMode.list({
    message: i18n.t('dashboard.bulkImport.selectSpaceType'),
    default: 'ezpaarse',
    choices: [
      { name: i18n.t('dashboard.bulkImport.ezpaarseSpace'), value: 'ezpaarse' },
      { name: i18n.t('dashboard.bulkImport.ezcounterSpace'), value: 'counter5' },
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

async function importDashboards(opts = {}) {
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

  let imported = 0;
  let conflicts = 0;
  let errors = 0;
  let indexPatterns;

  if (verbose) {
    console.log(`* Getting index patterns of space [${space?.id}] from ${config.ezmesure.baseUrl}`);
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

  try {
    const { data } = await kibana.savedObjects.find({
      space: space?.id,
      params: { type: 'index-pattern', per_page: 1000 },
    });
    indexPatterns = data?.saved_objects;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  let indexPatternTitle = indexPatterns?.[0]?.attributes?.title;

  if (Array.isArray(indexPatterns) && indexPatterns.length > 1) {
    let defaultPatternId;

    if (verbose) {
      console.log(`* Getting default index pattern of space [${space?.id}]`);
    }

    try {
      const { data } = await kibana.indexPatterns.getDefault({ space: space?.id });
      defaultPatternId = data?.index_pattern_id;
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    indexPatternTitle = await itMode.list({
      message: i18n.t('dashboard.bulkImport.selectIndexPattern'),
      choices: indexPatterns.map((pattern) => {
        const title = pattern?.attributes?.title || '';
        let name = title;

        if (pattern?.id === defaultPatternId) {
          name = `${title} ${chalk.yellow('(default)')}`;
        }

        return { name, value: title };
      }),
    });
  }

  if (!indexPatternTitle) {
    indexPatternTitle = await itMode.input({
      message: i18n.t('dashboard.bulkImport.noIndexPatternCreateOne'),
      default: `${space?.id}-*`,
    });

    try {
      if (verbose) { console.log(`* Creating index pattern [${indexPatternTitle}] into space [${space?.id}]`); }

      const { data: createdPattern } = await kibana.indexPatterns.create({
        space: space?.id,
        body: {
          index_pattern: { title: indexPatternTitle },
        },
      });

      const patternId = createdPattern?.index_pattern?.id;
      if (verbose) { console.log(`* Setting index pattern [${patternId}] as default in space [${space?.id}]`); }

      await kibana.indexPatterns.setDefault({
        space: space?.id,
        body: {
          index_pattern_id: patternId,
          force: true,
        },
      });
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }
  }

  await Promise.all(dashboards.map(async (dashboard) => {
    const dashboardObject = dashboard?.objects?.find?.((obj) => obj?.type === 'dashboard');
    const dashboardTitle = dashboardObject?.attributes?.title;

    if (idPrefix && dashboardObject?.id && !dashboardObject.id.startsWith(idPrefix)) {
      dashboardObject.id = `${idPrefix}${dashboardObject.id}`;
    }

    if (verbose) {
      console.log(`* Import dashboard [${dashboardTitle}] into space [${space?.id}] with index-pattern [${indexPatternTitle}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await dashboardsLib.import({
        space: space?.id,
        dashboard,
        indexPattern: indexPatternTitle,
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
    ignoreConflicts,
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
  } else {
    console.log('Downloading remote templates from ezpaarse-project/ezmesure-templates...');

    const dirs = await getRemoteTemplates();

    dashboardFiles = await itMode.autocomplete({
      message: i18n.t('dashboard.bulkImport.selectTemplateDir'),
      choices: dirs.map((dir) => ({ name: dir.path, value: dir.files })),
    });
  }

  dashboardFiles = await selectDashboards(dashboardFiles);

  if (dashboardFiles.length === 0) {
    console.log(i18n.t('dashboard.bulkImport.noDashboardsSelected'));
    process.exit(1);
  }

  if (!Array.isArray(spaces) || spaces.length === 0) {
    spaces = await getAllSpacesByType();
  } else {
    spaces = spaces.map((id) => ({ id }));
  }

  let totalImported = 0;
  let totalErrors = 0;
  let totalConflicts = 0;
  let totalMissingSpaces = 0;
  let totalAffectedSpaces = 0;

  for (let i = 0; i < spaces.length; i += 1) {
    const space = spaces[i];

    console.log();
    console.group(chalk.bold(i18n.t('dashboard.bulkImport.space', { name: space?.name, id: space?.id })));

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
