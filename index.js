#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable max-len */

'use strict';

const program = require('commander');
const axios = require('axios');

const config = require('./lib/elk_config');

let instance = axios.create({
  'auth': {
    'username': config.elkConfig.elasticsearchUser,
    'password': config.elkConfig.elasticsearchPassword
  },
  'timeout': 5000,
  'headers': {'kbn-xsrf': 'true'},
  'proxy':  false
});

async function getSpaces(space) {
  const url = space ? (config.elkConfig.kibanaUrl + '/api/spaces/space/'+ space) : config.elkConfig.kibanaUrl + '/api/spaces/space';

  try {
    const response = await instance.get(url);
    console.dir(response.data, { depth: null });
  } catch (error) {
    console.error(error);
  }
}


async function addSpaces(space) {
  // curl -X PUT "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'

  let defaultSpace =
  {
    'id': space,
    'name': space,
    'description' : 'This is the Test Space',
    'color': '#aabbcc',
    'initials': 'MK'
  };

  try {
    const response = await instance.post(config.elkConfig.kibanaUrl + '/api/spaces/space', defaultSpace);
    if (response.status === 200) { console.log('Espace %s créé', space); }
    else console.log(response.statusText, response.status);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

async function delSpaces(space) {
  // curl -X DELETE "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'

  try {
    const response = await instance.delete(config.elkConfig.kibanaUrl + '/api/spaces/space/'+ space);

    if (response.status === 204) { console.log('Espace %s supprimé', space); }
    else console.log(response.statusText, response.status);
  } catch (error) {
    console.error(error);
  }
}

async function findObjects(type) {
  // curl -X GET "http://localhost:5601/api/saved_objects/_find" -H 'kbn-xsrf: true'

  if (type) {
    try {
      const response = await instance.get(config.elkConfig.kibanaUrl + '/api/saved_objects/_find', {'params': { 'type' : type}});
      console.dir(response.data, { depth: null });
    } catch (error) {
      console.error(error);
    }
  } else {
    console.error('error: type required');
  }
}

async function exportDashboard(dashboardId) {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'

  if (dashboardId) {
    try {
      const response = await instance.get(config.elkConfig.kibanaUrl + '/api/kibana/dashboards/export', {'params': { 'dashboard' : dashboardId}});
      if (response.status === 200) {
        console.log('Dashboard %s exporté', dashboardId);
      } else {
        console.log('Problème à l\'export de %s', dashboardId);
      }
      return response.data;
    } catch (error) {
      console.error(error);
    }
  } else {
    console.error('error: dashboardId required');
  }
}

async function importDashboardInSpace(dashboardId, space) {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'
  // http://localhost:5601/s/sales/api/kibana/dashboards/import --data-binary @export.json
  let exportedDashboard;
  let objects;

  if (dashboardId) {
    try {
      exportedDashboard = await exportDashboard(dashboardId);
      await addSpaces(space);
      objects = await instance.post(config.elkConfig.kibanaUrl + '/s/' + space +
      '/api/kibana/dashboards/import', exportedDashboard);
      if (objects.status === 200) {
        console.log('Dashboard %s importé', dashboardId);
      } else {
        console.log('Problème à l\'export de %s', dashboardId);
      }
    } catch (error) {
      console.error(`error: ${error}`);
    }
  } else {
    console.error('error: dashboardId required');
  }
}



program
  .version('0.0.1')
  .command('spaces [space]')
  .description('List all KIBANA spaces or [space] space attributes')
  .action(function (space) {
    getSpaces(space);
  });

program
  .command('space-add <space>')
  .description('Add a KIBANA space with default attributes')
  .action(function (space) {
    addSpaces(space);
  });

program
  .command('space-del <space>')
  .description('Delete a KIBANA space')
  .action(function (space) {
    delSpaces(space);
  });

program
  .command('objects-find <type>')
  .description('Find KIBANA objects')
  .action(function (type) {
    findObjects(type);
  });

program
  .command('dashboard-export <dasboardId>')
  .description('Export dashboard by Id')
  .action(function (dasboardId) {
    exportDashboard(dasboardId);
  });

program
  .command('dashboard-move-in-space <dashboardId> <space>')
  .description('Move dashboard by Id in another space')
  .action(function (dashboardId, space) {
    importDashboardInSpace(dashboardId, space);
  });

program.parse(process.argv);
// console.log(program.args);






