const { i18n } = global;

const { flush } = require('../../../lib/cluster');

exports.command = 'flush';
exports.desc = i18n.t('cluster.flush.description');
exports.builder = {};
exports.handler = async function handler() {
  let response;
  try {
    const { body } = await flush();
    response = body;
  } catch (e) {
    const dataError = e.response && e.response.body && e.response.body.error;
    console.error(i18n.t('cluster.flush.flushFailed'));
    console.error(dataError || e.message);
    process.exit(1);
  }

  if (!response || !response._shards) {
    console.error(i18n.t('cluster.invalidReponse'));
    console.error(response);
    process.exit(1);
  }

  console.info(`${i18n.t('cluster.flush.total')}: ${response._shards.total}`);
  console.info(`${i18n.t('cluster.flush.successful')}: ${response._shards.successful}`);
  console.info(`${i18n.t('cluster.flush.failed')}: ${response._shards.failed}`);

  if (response._shards.failed > 0) {
    console.error(i18n.t('cluster.flush.shardsFailed'));
    process.exit(1);
  }

  process.exit(0);
};
