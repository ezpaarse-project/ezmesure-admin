const { i18n } = global;

const elasticLib = require('../../lib/cluster');
const ezmesure = require('../../lib/app/ezmesure');
const { config } = require('../../lib/app/config');
const { formatApiError } = require('../../lib/utils');

exports.command = 'ping';
exports.desc = i18n.t('ping.description');
exports.builder = function builder() {};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  if (verbose) {
    console.log(`* Attempt to ping from ${config.elastic.baseUrl}`);
  }

  let elasticPing;
  try {
    elasticPing = await elasticLib.ping();
  } catch (error) {
    console.error(`ElasticSearch [${config.elastic.baseUrl}]: Ping failed`);
    console.error(`ElasticSearch respond with statusCode [${error?.meta?.statusCode}]`);
  }

  if (elasticPing) {
    console.log(`ElasticSearch [${config.elastic.baseUrl}]: OK`);
  }

  if (verbose) {
    console.log(`* Attempt to ping from ${config.elastic.baseUrl}`);
  }

  let ezmesurePing;
  try {
    ezmesurePing = await ezmesure.get('/');
  } catch (error) {
    console.error(`ezMESURE [${config.ezmesure.baseUrl}]: Ping failed`);
    console.error(formatApiError(error));
  }

  if (ezmesurePing) {
    console.log(`ezMESURE [${config.ezmesure.baseUrl}]: OK`);
  }
};
