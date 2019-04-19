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
  if (body) { fullCommand += ' -d ' + body; }

  // console.log(fullCommand);

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

program
  .version('0.0.1')
  .command('list [space]')
  .description('List [space] KIBANA spaces or all')
  .action(function (space) {
    getSpaces(space);
  });

program.parse(process.argv);
// console.log(program.args);






