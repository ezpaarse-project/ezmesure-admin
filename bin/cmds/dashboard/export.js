const { i18n } = global;

const path = require('path');
const fs = require('fs-extra');
const { format } = require('date-fns');

const itMode = require('./interactive/export');
const dashboards = require('../../../lib/dashboards');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'export [space]';
exports.desc = i18n.t('dashboard.export.description');
exports.builder = function builder(yargs) {
  return yargs.positional('space', {
    describe: i18n.t('dashboard.export.options.space'),
    type: 'string',
  }).option('d', {
    alias: 'dashboard',
    describe: i18n.t('dashboard.export.options.all'),
    type: 'array',
  }).option('o', {
    alias: 'output',
    describe: i18n.t('dashboard.export.options.output'),
    type: 'string',
  }).option('it', {
    alias: 'interactive',
    describe: i18n.t('dashboard.export.options.interactive'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const {
    space, dashboard, interactive, verbose,
  } = argv;

  let selectedSpace = space;
  let dashboardsSelected = dashboard;

  if (interactive) {
    const { spaceId, dashboardsId } = await itMode();
    selectedSpace = spaceId;
    dashboardsSelected = dashboardsId;
  }

  if (selectedSpace === 'default') { selectedSpace = undefined; }

  if (!dashboardsSelected) {
    console.log('No dashboard(s) selected');
    process.exit(0);
  }

  for (let i = 0; i < dashboardsSelected.length; i += 1) {
    if (verbose) {
      console.log(`* Export dashboard [${dashboardsSelected[i]}] from space [${selectedSpace}] from ${config.ezmesure.baseUrl}`);
    }

    let dashboardData;
    try {
      const { data } = await dashboards.export({
        space: selectedSpace,
        dashboard: dashboardsSelected[i],
      });
      dashboardData = data;
    } catch (err) {
      console.error(formatApiError(err));
      process.exit(1);
    }

    if (argv.output) {
      const currentDate = format(new Date(), 'yyyy_MM_dd_H_m_s');
      const fileName = `export_dashboard_${argv.space ? `${argv.space}_` : ''}${dashboardsSelected[i]}_${currentDate}`;
      const filePath = path.resolve(argv.output, `${fileName}.json`);
      try {
        await fs.writeJson(filePath, dashboardData, { spaces: 2 });
      } catch (error) {
        console.log(error);
      }

      const dshData = dashboardData.objects.filter(({ type }) => type === 'dashboard');

      console.log(i18n.t('dashboard.export.exported', {
        title: dshData?.pop().attributes?.title,
        path: filePath,
      }));
    }

    if (!argv.output) {
      console.log(JSON.stringify(dashboardData, null, 2));
    }
  }
};
