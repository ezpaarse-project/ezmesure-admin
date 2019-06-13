const logger = require('../../lib/app/logger');
const spacesLib = require('../../lib/spaces');
const dashboardLib = require('../../lib/dashboard');

const dashboard = {};

dashboard.exportDashboard = async (dashboardId, opts) => {
  try {
    const res = await dashboardLib.export(dashboardId, opts);
    if (res.status === 200) {
      if (res.data) {
        console.log(JSON.stringify(res.data, null, 2));
      }
    }
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

dashboard.importDashboardInSpace = async (dashboardId, space, opts) => {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'
  // http://localhost:5601/s/sales/api/kibana/dashboards/import --data-binary @export.json

  try {
    const { data: exportedDashboard } = await dashboardLib.export(dashboardId);
    if (exportedDashboard) {
      logger.info(`Dashboard ${dashboardId} exported`);
    }

    if (exportedDashboard.objects[0].error) {
      logger.error(`Problem with the export of ${dashboardId} : ${JSON.stringify(exportedDashboard.objects[0].error)}`);
      return;
    }

    if (opts && opts.new) {
      const defaultSpace = spacesLib.buildSpace(space, opts);
      const response = await spacesLib.addSpaces(defaultSpace);
      if (response.status === 200) {
        logger.info(`Space ${space} created`);
      }
    }

    const objects = await dashboardLib.import(space, exportedDashboard);

    if (objects.status === 200) {
      logger.info(`Dashboard ${dashboardId} imported`);
    } else {
      logger.error(`Problem with the import of ${dashboardId} in ${space}`);
    }
  } catch (error) {
    console.trace(error);
    logger.error(error);
    process.exit(1);
  }
};

module.exports = dashboard;
