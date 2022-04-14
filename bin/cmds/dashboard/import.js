const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');

const dashboards = require('../../../lib/dashboards');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');
const itMode = require('./interactive/import');

exports.command = 'import [space]';
exports.desc = i18n.t('dashboard.import.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('dashboard.import.options.space'),
    type: 'string',
  })
    .option('i', {
      alias: 'index-pattern',
      type: 'string',
      describe: i18n.t('dashboard.import.options.indexPattern'),
    })
    .option('o', {
      alias: 'overwrite',
      type: 'boolean',
      describe: i18n.t('dashboard.import.options.overwrite'),
    })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('dashboard.import.options.interactive'),
      type: 'boolean',
    })
    .option('f', {
      alias: 'files',
      type: 'array',
      describe: i18n.t('dashboard.import.options.files'),
    })
    .array('files');
};
exports.handler = async function handler(argv) {
  const {
    files, overwrite, indexPattern, interactive, verbose,
  } = argv;

  let { space } = argv;

  if (!files) {
    console.log(i18n.t('dashboard.import.noFiles'));
    process.exit(1);
  }

  if (interactive) {
    const { spaceId } = await itMode();
    space = spaceId;
  }

  if (space === 'default') { space = undefined; }

  for (let i = 0; i < files.length; i += 1) {
    const filePath = path.resolve(files[i]);

    if (verbose) {
      console.log(`* Read dashboard file from ${filePath}`);
    }

    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (err) {
      console.error(err);
      console.error(i18n.t('dashboard.import.cannotRead', { file: files[i] }), err);
    }

    if (content) {
      let dashboard;
      try {
        if (verbose) {
          console.log(`* Parse dashboard data from ${filePath}`);
        }

        dashboard = JSON.parse(content);
      } catch (e) {
        console.error(i18n.t('dashboard.import.cannotParse', { file: files[i] }), e);
      }

      if (dashboard) {
        const dshData = dashboard.objects.filter(({ type }) => type === 'dashboard');
        const title = dshData?.pop().attributes?.title;

        if (verbose) {
          console.log(`* Import dashboard [${title}] into space [${space}] with index-pattern [${indexPattern}] from ${config.ezmesure.baseUrl}`);
        }

        try {
          await dashboards.import({
            space,
            dashboard,
            indexPattern,
            force: overwrite,
          });

          console.log(i18n.t('dashboard.import.imported', { title }));
        } catch (error) {
          console.error(formatApiError(error));
          process.exit(1);
        }
      }
    }
  }
};
