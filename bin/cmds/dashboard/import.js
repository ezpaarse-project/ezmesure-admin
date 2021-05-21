const { i18n } = global;

const fs = require('fs-extra');
const path = require('path');

const get = require('lodash.get');

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const spacesLib = require('../../../lib/spaces');
const dashboardLib = require('../../../lib/dashboard');

exports.command = 'import [space]';
exports.desc = i18n.t('dashboard.import.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('dashboard.import.options.space'),
    type: 'string',
  })
    .option('i', {
      alias: 'index-pattern',
      describe: i18n.t('dashboard.import.options.indexPattern'),
    })
    .option('o', {
      alias: 'overwrite',
      type: 'boolean',
      describe: i18n.t('dashboard.import.options.overwrite'),
    })
    .option('f', {
      alias: 'files',
      describe: i18n.t('dashboard.import.options.files'),
    })
    .array('files');
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }

  let files = [];

  if (argv.files) { files = argv.files; }

  let spaceId;
  if (argv.space) {
    try {
      const { data } = await spacesLib.findById(argv.space);
      if (data) { spaceId = get(data, 'id'); }
    } catch (error) {
      console.error(i18n.t('dashboard.spaceNotFound', { spaceName: argv.space }));
      process.exit(1);
    }
  }

  if (!argv.space) {
    let spaces;
    try {
      const { data } = await spacesLib.findAll();
      if (data) { spaces = data; }
    } catch (error) {
      console.error(i18n.t('dashboard.spaceNotFound', { spaceName: argv.space }));
    }

    const { spaceSelected } = await inquirer.prompt([{
      type: 'autocomplete',
      pageSize: 20,
      name: 'spaceSelected',
      message: i18n.t('spaces.spaceCheckbox'),
      searchable: true,
      highlight: true,
      source: (answersSoFar, input) => new Promise((resolve) => {
        input = input ? input.toLowerCase() : '';

        const result = spaces
          .map(({ id, name }) => ({ name, value: id }))
          .filter(({ name }) => name.toLowerCase().includes(input));

        resolve(result);
      }),
    }]);

    spaceId = spaceSelected;
  }

  if (!spaceId) {
    console.error(i18n.t('dashboard.spaceNotFound', { spaceName: argv.space }));
    process.exit(1);
  }

  let indexPattern = argv['index-pattern'];
  if (!argv['index-pattern']) {
    const { index } = await inquirer.prompt([{
      type: 'input',
      name: 'index',
      message: i18n.t('dashboard.import.indexPattern'),
    }]);

    indexPattern = index;
  }

  if (!indexPattern) {
    console.log(i18n.t('dashboard.import.noIndexPattern'));
    process.exit(0);
  }

  const dashboards = [];
  for (let i = 0; i < files.length; i += 1) {
    let content;
    try {
      content = await fs.readFile(path.resolve(files[i]), 'utf8');
    } catch (err) {
      console.error(err);
      console.error(i18n.t('dashboard.import.cannotRead', { file: files[i] }), err);
    }

    if (content) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error(i18n.t('dashboard.import.cannotParse', { file: files[i] }), e);
      }

      if (!Array.isArray(content)) {
        dashboards.push(content);
      }

      if (Array.isArray(content)) {
        content.forEach((data) => dashboards.push(data));
      }
    }
  }

  if (!dashboards.length) {
    console.log(i18n.t('dashboard.import.noDashboardData'));
    process.exit(1);
  }

  for (let i = 0; i < dashboards.length; i += 1) {
    const dashboard = dashboards[i];

    for (let j = 0; j < dashboard.objects.length; j += 1) {
      const object = dashboard.objects[j];

      object.namespaces = [argv.space];

      if (object.type === 'index-pattern') {
        object.attributes.title = indexPattern;
      }
    }

    try {
      const { status, data } = await dashboardLib
        .importOne(argv.space || spaceId, dashboard, argv.overwrite || false);

      if (status !== 200) {
        console.log(i18n.t('dashboard.import.error', { status }));
      }

      if (data && status === 200) {
        const errors = data.objects.filter(({ error }) => error);
        if (errors.length) {
          console.log(i18n.t('dashboard.import.conflict'));
        } else {
          console.log(i18n.t('dashboard.import.imported'));
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};
