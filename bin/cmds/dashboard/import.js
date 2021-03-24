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
exports.desc = 'Import dashboard(s)';
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: 'Space name, case sensitive',
    type: 'string',
  })
    .option('i', {
      alias: 'index-pattern',
      describe: 'Index pattern name',
    })
    .option('o', {
      alias: 'overwrite',
      type: 'boolean',
      describe: 'Overwrite conflicts',
    })
    .option('f', {
      alias: 'files',
      describe: 'Files path',
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
      console.log(`space [${argv.space}] not found`);
      process.exit(1);
    }
  }

  if (!argv.space) {
    let spaces;
    try {
      const { data } = await spacesLib.findAll();
      if (data) { spaces = data; }
    } catch (error) {
      console.log(`space [${argv.space}] not found`);
    }

    const { spaceSelected } = await inquirer.prompt([{
      type: 'autocomplete',
      pageSize: 20,
      name: 'spaceSelected',
      message: 'Spaces (enter: select space)',
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
    console.log(`space [${argv.space}] not found`);
    process.exit(1);
  }

  let indexPattern = argv['index-pattern'];
  if (!argv['index-pattern']) {
    const { index } = await inquirer.prompt([{
      type: 'input',
      name: 'index',
      message: 'Index pattern :',
    }]);

    indexPattern = index;
  }

  if (!indexPattern) {
    console.log('No index pattern');
    process.exit(0);
  }

  const dashboards = [];
  for (let i = 0; i < files.length; i += 1) {
    let content;
    try {
      content = await fs.readFile(path.resolve(files[i]), 'utf8');
    } catch (err) {
      console.error(err);
      console.error(`Cannot read file : ${files[i]}`, err);
    }

    if (content) {
      try {
        content = JSON.parse(content);
      } catch (e) {
        console.error(`Cannot parse : ${files[i]}`, e);
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
    console.log('No dashboard(s) data found.');
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
        console.log(`[Error#${status}] : dashbord does not imported`);
      }

      if (data && status === 200) {
        const errors = data.objects.filter(({ error }) => error);
        if (errors.length) {
          console.log('There are conflicts, use the --overwrite option to force the rewriting of conflicts');
        } else {
          console.log('Dashboard imported successfully');
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
};
