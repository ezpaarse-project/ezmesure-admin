const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');

const logger = require('../../../lib/logger');
const dashboards = require('../../../lib/dashboards');
const { config } = require('../../../lib/app/config');
const itMode = require('./interactive/import');

exports.command = 'import [space]';
exports.desc = i18n.t('dashboard.import.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('dashboard.import.options.space'),
    type: 'string',
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
    .option('i', {
      alias: 'index-pattern',
      describe: i18n.t('dashboard.import.options.indexPattern'),
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
    files, overwrite, interactive, verbose, indexPattern,
  } = argv;

  let { space } = argv;

  if (verbose) { logger.setLevel('verbose'); }

  logger.verbose(`Host: ${config.ezmesure.baseUrl}`);

  if (!files) {
    logger.error(i18n.t('dashboard.import.noFiles'));
    process.exit(1);
  }

  if (interactive) {
    const { spaceId } = await itMode();
    space = spaceId;
  }

  if (space === 'default') { space = undefined; }

  for (let i = 0; i < files.length; i += 1) {
    const filePath = path.resolve(files[i]);

    logger.verbose(`Read dashboard file from ${filePath}`);

    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch (error) {
      logger.error(`Cannot read file [${filePath}] ${error?.message}`);
      process.exit(1);
    }

    if (content) {
      let dashboard;
      logger.verbose(`Parse dashboard from [${filePath}]`);
      try {
        dashboard = JSON.parse(content);
      } catch (error) {
        logger.error(`Cannot parse dashboard from [${filePath}]`);
        process.exit(1);
      }

      if (dashboard) {
        const dshData = dashboard.objects.filter(({ type }) => type === 'dashboard');
        const title = dshData?.pop().attributes?.title;

        logger.verbose(`Import dashboard [${title}] into space [${space}]`);

        try {
          await dashboards.import({
            space,
            dashboard,
            indexPattern,
            force: overwrite,
          });
        } catch (error) {
          logger.error(`Cannot import dashboard [${filePath}] - ${error?.response?.status}`);
          process.exit(1);
        }
        logger.info(i18n.t('dashboard.import.imported', { title }));
      }
    } else {
      logger.error(`No dashboard from [${filePath}]`);
      process.exit(1);
    }
  }
};
