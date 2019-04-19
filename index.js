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

  const { stdout, stderr } = await exec(fullCommand);
  if (stderr) {
    console.error(`error: ${stderr}`);
  }
  return stdout;

}

async function getSpaces(space) {
  // curl -X GET "http://localhost:5601/api/spaces/space" -H 'kbn-xsrf: true'
  let spaces;

  if (space) {
    spaces = await curlCommand('GET', config.elkConfig.kibanaUrl + '/api/spaces/space/' + space, '');
  } else {
    spaces = await curlCommand('GET', config.elkConfig.kibanaUrl + '/api/spaces/space', '');
  }
  const object = JSON.parse(spaces);
  console.dir(object, {depth: null, colors: true});
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
  // console.dir(object, {depth: null, colors: true});
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

program.parse(process.argv);
console.log(program.args);






