const logger = require('../../lib/app/logger');
const spacesLib = require('../../lib/spaces');
const dashboardLib = require('../../lib/dashboard');
const objectsLib = require('../../lib/objects');

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

const importDashboards = async (space, dashboards, opts) => {
  for (let i = 0; i < dashboards.length; i += 1) {
    try {
      const { data: exportedDashboard } = await dashboardLib.export(dashboards[i]);
      if (exportedDashboard) {
        logger.info(`Dashboard ${dashboards[i]} exported`);
      }

      if (exportedDashboard.objects[0].error) {
        logger.error(`Problem with the export of ${dashboards[i]} : ${JSON.stringify(exportedDashboard.objects[0].error)}`);
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
        logger.info(`Dashboard ${dashboards[i]} imported`);
      } else {
        logger.error(`Problem with the import of ${dashboards[i]} in ${space}`);
      }
    } catch (error) {
      console.trace(error);
      logger.error(error);
      process.exit(1);
    }
  }
};

const importDashboardByTitle = async (space, title, opts) => {
  try {
    const { data: objects } = await objectsLib.findObjects('dashboard', { title: title[0] });
    const dashboards = objects.saved_objects.map(object => object.id);

    return importDashboards(space, dashboards, opts);
  } catch (e) {
    console.error(e);
    return process.exit(e);
  }
};

dashboard.importDashboardInSpace = async (space, dashboards, opts) => {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'
  // http://localhost:5601/s/sales/api/kibana/dashboards/import --data-binary @export.json

  if (/^([a-f0-9]{8})-([a-f0-9]{4})-([a-f0-9]{4})-([a-f0-9]{4})-([a-f0-9]{12})$/i.test(dashboards[0])) {
    return importDashboards(space, dashboards, opts);
  }

  return importDashboardByTitle(space, dashboards, opts);
};

module.exports = dashboard;
