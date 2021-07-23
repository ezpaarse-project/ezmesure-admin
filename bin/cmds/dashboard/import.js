const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');

const dashboards = require('../../../lib/dashboards');
const it = require('./interactive/import');

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
    files, overwrite, indexPattern, interactive,
  } = argv;

  let { space } = argv;

  if (!files) {
    console.log(i18n.t('dashboard.import.noFiles'));
    process.exit(1);
  }

  if (interactive) {
    const { spaceId } = await it();
    space = spaceId;
  }

  for (let i = 0; i < files.length; i += 1) {
    let content;
    try {
      content = await fs.readFile(path.resolve(files[i]), 'utf8');
    } catch (err) {
      console.error(err);
      console.error(i18n.t('dashboard.import.cannotRead', { file: files[i] }), err);
    }

    if (content) {
      let dashboard;
      try {
        dashboard = JSON.parse(content);
      } catch (e) {
        console.error(i18n.t('dashboard.import.cannotParse', { file: files[i] }), e);
      }

      if (dashboard) {
        try {
          await dashboards.import({
            space,
            dashboard,
            indexPattern,
            force: overwrite,
          });

          const dshData = dashboard.objects.filter(({ type }) => type === 'dashboard');

          console.log(i18n.t('dashboard.import.imported', { title: dshData?.pop().attributes?.title }));
        } catch (error) {
          if (error.response.data) {
            console.error(`[Error#${error.response.data.status}] ${error.response.data.error}`);
            process.exit(1);
          } else {
            console.error(error);
          }
        }
      }
    }
  }
};
