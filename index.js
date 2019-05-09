#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable max-len */

'use strict';

const program = require('commander');
const util = require('util');

const exec = util.promisify(require('child_process').exec);
const config = require('./lib/elk_config');

async function curlCommand(method, url, body) {
  const cmd = 'curl -s -u "' + config.elkConfig.elasticsearchUser + ':' + config.elkConfig.elasticsearchPassword + '" -H \'kbn-xsrf: true\'';
  let fullCommand = cmd + ' -X ' + method + ' ' + url;
  if (body) { fullCommand += ' -H \'Content-Type: application/json\' -d \'' + body + '\''; }

  console.log(fullCommand);

  try {
    const { stdout } = await exec(fullCommand);
    return stdout;
  } catch (error) {
    console.error(`error0: ${error}`);
  }
}

async function getSpaces(space) {
  // curl -X GET "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'
  let spaces;

  if (space) {
    try {
      spaces = await curlCommand('GET', config.elkConfig.kibanaUrl + '/api/spaces/space/' + space, '');
    } catch (error) {
      console.error(`error: ${error}`);
    }  
  } else {
    try {
      spaces = await curlCommand('GET', config.elkConfig.kibanaUrl + '/api/spaces/space', '');
    } catch (error) {
      console.error(`error: ${error}`);
    }  
  }

  if (spaces) {
    const object = JSON.parse(spaces);
    console.dir(object, {depth: null, colors: true});
  }
}

async function addSpaces(space) {
  // curl -X PUT "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'
  let spaces;

  let defaultSpace =
  {
    'id': space,
    'name': space,
    'description' : 'This is the Test Space',
    'color': '#aabbcc',
    'initials': 'MK'
  };

  spaces = await curlCommand('POST', config.elkConfig.kibanaUrl + '/api/spaces/space', JSON.stringify(defaultSpace));

  const object = JSON.parse(spaces);
  console.dir(object, {depth: null, colors: true});
}

async function delSpaces(space) {
  // curl -X DELETE "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'
  let spaces;

  spaces = await curlCommand('DELETE', config.elkConfig.kibanaUrl + '/api/spaces/space/' + space, '');

  // const object = JSON.parse(spaces);
  console.dir(spaces);
}

async function findObjects(type) {
  // curl -X GET "http://localhost:5601/api/saved_objects/_find" -H 'kbn-xsrf: true'
  let objects;

  if (type) {
    try {
      objects = await curlCommand('GET', config.elkConfig.kibanaUrl + '/api/saved_objects/_find?type=' + type, '');
    } catch (error) {
      console.error(`error: ${error}`);
    }
  } else {
    console.error('error: type required');
  }

  if (objects) {
    const object = JSON.parse(objects);
    console.dir(object, {depth: null, colors: true});
  }
}

async function exportDashboard(dashboardId) {
  // curl -X GET "http://localhost:5601/api/kibana/dashboards/export?dashboard=" -H 'kbn-xsrf: true'
  let objects;

  if (dashboardId) {
    try {
      objects = await curlCommand('GET', config.elkConfig.kibanaUrl + '/api/kibana/dashboards/export?dashboard=' + dashboardId, '');
    } catch (error) {
      console.error(`error: ${error}`);
    }
  } else {
    console.error('error: dashboardId required');
  }

  if (objects) {
    const object = JSON.parse(objects);
    console.dir('toto');
    console.dir(object, {depth: null, colors: true});
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

program.parse(process.argv);
console.log(program.args);






