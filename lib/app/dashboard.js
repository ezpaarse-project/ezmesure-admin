const config = require('config');
const logger = require('../logger');
const instance = require('../api');
const libSpaces = require('./spaces');

const dashboard = {};

dashboard.export = (dashboardId, opts) => {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'

  const url = (opts && opts.space) ? `${config.kibanaUrl}s/${opts.space}/api/kibana/dashboards/export` : `${config.kibanaUrl}/api/kibana/dashboards/export`;
  return instance.get(url, {
    params: {
      dashboard: dashboardId,
    },
  });
};

dashboard.exportDashboard = async (dashboardId, opts) => {
  try {
    const res = await dashboard.export(dashboardId, opts);
    if (res.status === 200) {
      console.log(JSON.stringify(res, null, 2));
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
    const { data: exportedDashboard } = await dashboard.export(dashboardId);

    if (exportedDashboard.objects[0].error) {
      logger.error(`Problem with the export of ${dashboardId} : ${JSON.stringify(exportedDashboard.objects[0].error)}`);
      return;
    }

    if (opts && opts.new) {
      await libSpaces.addSpaces(space);
    }

    const objects = await instance.post(`${config.kibanaUrl}/s/${space}/api/kibana/dashboards/import`, exportedDashboard);

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
