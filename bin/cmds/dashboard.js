const inquirer = require('inquirer');
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

const parseDashboardObjects = (objects, space) => objects.map((object) => {
  const tmpObject = object;

  if (tmpObject.attributes) {
    const { attributes } = tmpObject;

    if (tmpObject.id && tmpObject.id === 'univ-*') {
      tmpObject.id = tmpObject.id.replace(/univ-\*/i, space);
    }

    if (attributes.title) {
      attributes.title = attributes.title.replace(/univ-\*/i, space);
    }

    if (attributes.visState) {
      const visState = JSON.parse(attributes.visState);
      if (visState.title) {
        visState.title = attributes.title;
      }

      if (visState.params && visState.params.controls) {
        visState.params.controls = visState.params.controls.map((controls) => {
          const tmpControls = controls;
          tmpControls.indexPattern = tmpControls.indexPattern.replace(/univ-\*/i, space);
          return tmpControls;
        });
      }
      attributes.visState = JSON.stringify(visState);
    }

    if (attributes.kibanaSavedObjectMeta) {
      const searchSourceJSON = JSON.parse(attributes.kibanaSavedObjectMeta.searchSourceJSON);
      if (searchSourceJSON.index) {
        searchSourceJSON.index = searchSourceJSON.index.replace(/univ-\*/i, space);
        attributes.kibanaSavedObjectMeta.searchSourceJSON = JSON.stringify(searchSourceJSON);
      }
    }
  }
  return tmpObject;
});

const importDashboards = async (space, dashboards) => {
  for (let i = 0; i < dashboards.length; i += 1) {
    try {
      let dashboardData;
      const { data: exportedDashboard } = await dashboardLib.export(dashboards[i]);
      if (exportedDashboard && exportedDashboard.objects) {
        dashboardData = exportedDashboard.objects.pop();
        exportedDashboard.objects = parseDashboardObjects(exportedDashboard.objects, space);
        logger.info(`Dashboard ${dashboardData.attributes.title} exported`);
      }

      if (exportedDashboard.objects[0].error) {
        logger.error(`Problem with the export of ${dashboardData.attributes.title} : ${JSON.stringify(exportedDashboard.objects[0].error)}`);
      }

      const objects = await dashboardLib.import(space, exportedDashboard);

      if (objects.status === 200) {
        logger.info(`Dashboard ${dashboardData.attributes.title} imported`);
      } else {
        logger.error(`Problem with the import of ${dashboardData.attributes.title} in ${space}`);
      }
    } catch (error) {
      console.trace(error);
      logger.error(error);
      process.exit(1);
    }
  }
};

dashboard.importDashboardInSpace = async (space, dashboards, opts) => {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'
  // http://localhost:5601/s/sales/api/kibana/dashboards/import --data-binary @export.json

  let dashboardsToUse = dashboards;

  if (opts && opts.title) {
    const { data: savedObjects } = await objectsLib.findObjects('dashboard', { title: opts.title });

    const choices = [];
    savedObjects.saved_objects.forEach((object) => {
      if (object.attributes.title.includes(opts.title)) {
        choices.push({ name: object.attributes.title, value: object.id });
      }
    });

    if (choices.length > 0) {
      await inquirer.prompt([{
        type: 'checkbox',
        pageSize: 20,
        name: 'dashboardsId',
        message: `${space} dashboards`,
        choices,
        highlight: true,
      }]).then((answers) => {
        dashboardsToUse = answers.dashboardsId;
      });
    }

    if (choices.length === 0) {
      return logger.info(`No dashboards founds for ${opts.title}`);
    }
  }

  try {
    const spaceExists = await spacesLib.getSpaces(space);

    if (opts && opts.new) {
      if (!spaceExists) {
        const defaultSpace = await spacesLib.buildSpace(space, opts);
        const response = await spacesLib.addSpaces(defaultSpace);
        if (response.status === 200) {
          logger.info(`Space ${space} created`);
        }
      }
    }

    return importDashboards(space, dashboardsToUse);
  } catch (error) {
    return logger.warn(`${space} doesn't exists`);
  }
};

module.exports = dashboard;
