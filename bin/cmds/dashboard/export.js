const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const get = require('lodash.get');

const inquirer = require('inquirer');
const checkboxPlus = require('inquirer-checkbox-plus-prompt');
const autocomplete = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt('checkbox-plus', checkboxPlus);
inquirer.registerPrompt('autocomplete', autocomplete);

const { findAll, findById } = require('../../../lib/spaces');
const { findBySpace, exportOne } = require('../../../lib/dashboard');

exports.command = 'export [space]';
exports.desc = 'Export dashboard';
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: 'Space name, case sensitive',
    type: 'string',
  }).option('a', {
    alias: 'all',
    describe: 'Export all dashboards',
  }).option('o', {
    alias: 'output',
    describe: 'Output path',
  });
};
exports.handler = async function handler(argv) {
  const options = {};

  if (argv.timeout) { options.timeout = argv.timeout; }
  if (argv.token) { options.token = argv.token; }

  let spaceId;
  if (argv.space) {
    try {
      const { data } = await findById(argv.space);
      if (data) { spaceId = get(data, 'id'); }
    } catch (error) {
      console.error(`space [${argv.space}] not found`);
      process.exit(1);
    }
  }

  if (!argv.space) {
    let spaces;
    try {
      const { data } = await findAll();
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
    console.log('No space selected');
    process.exit(0);
  }

  let dashboards;
  try {
    const { body } = await findBySpace(spaceId);
    if (body) { dashboards = get(body, 'hits.hits'); }
  } catch (error) {
    console.log(error);
  }

  if (!argv.all) {
    const { dashboardsId } = await inquirer.prompt([
      {
        type: 'checkbox-plus',
        name: 'dashboardsId',
        pageSize: 20,
        searchable: true,
        highlight: true,
        message: 'Dashboard (space to select, enter to valid) :',
        source: (answersSoFar, input) => new Promise((resolve) => {
          const result = dashboards
            .map(({ _id, _source }) => ({ name: _source.dashboard.title, value: _id }))
            .filter(({ name }) => name.toLowerCase().includes(input.toLowerCase()));

          resolve(result);
        }),
      },
    ]);

    if (!dashboardsId.length) {
      console.log('No dashaboard(s) selected.');
      process.exit(0);
    }

    dashboards = dashboards.filter(({ _id }) => dashboardsId.includes(_id));
  }

  for (let i = 0; i < dashboards.length; i += 1) {
    let [, dashboardId] = dashboards[i]._id.split(':');
    if (spaceId !== 'default') {
      [,, dashboardId] = dashboards[i]._id.split(':');
    }
    let dashboardData;
    try {
      const { data } = await exportOne(dashboardId, spaceId === 'default' ? null : spaceId);
      if (data) { dashboardData = data; }
    } catch (error) {
      console.log(`dashboard [${dashboards[i]._id}] not found`);
    }

    if (dashboardData) {
      if (argv.output) {
        const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
        const fileName = `export_dashboard_${dashboardId}_${currentDate}`;
        try {
          await fs.writeJson(path.resolve(argv.output, `${fileName}.json`), dashboardData, { spaces: 2 });
        } catch (error) {
          console.log(error);
        }
        console.log(`dashboard [${dashboards[i]._source.dashboard.title}] exported successfully`);
      }

      if (!argv.output) {
        console.log(JSON.stringify(dashboardData, null, 2));
      }
    }
  }
};
