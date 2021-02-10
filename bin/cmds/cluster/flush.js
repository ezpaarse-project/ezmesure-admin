const { flush } = require('../../../lib/cluster');

exports.command = 'flush';
exports.desc = 'Flush all data streams and indices in the cluster';
exports.builder = {};
exports.handler = async function handler() {
  let response;
  try {
    const { body } = await flush();
    response = body;
  } catch (e) {
    const dataError = e.response && e.response.body && e.response.body.error;
    console.error('Failed to flush cluster');
    console.error(dataError || e.message);
    process.exit(1);
  }

  if (!response || !response._shards) {
    console.error('Invalid elasticsearch response body');
    console.error(response);
    process.exit(1);
  }

  console.info(`Total: ${response._shards.total}`);
  console.info(`Successful: ${response._shards.successful}`);
  console.info(`Failed: ${response._shards.failed}`);

  if (response._shards.failed > 0) {
    console.error('Some shards failed to flush');
    process.exit(1);
  }

  process.exit(0);
};
