const { i18n } = global;

const elasticLib = require('../../lib/cluster');
const ezmesure = require('../../lib/app/ezmesure');

exports.command = 'ping';
exports.desc = i18n.t('ping.description');
exports.builder = function builder() {};
exports.handler = async function handler(argv) {
  let elasticPing;
  try {
    elasticPing = await elasticLib.ping();
  } catch (error) {
    console.error('ElasticSearch: Ping failed');
    console.log(error);
  }

  if (elasticPing) {
    console.log('ElasticSearch: OK');
  }

  let ezmesurePing;
  try {
    ezmesurePing = await ezmesure.get('/');
  } catch (error) {
    console.error('ezMESURE: Ping failed');
    console.log(error);
  }

  if (ezmesurePing) {
    console.log('ezMESURE: OK');
  }
};
