const cluster = require('../../lib/cluster');
const logger = require('../../lib/app/logger');

module.exports = {
  setShardAllocation: async (enabledShards) => {
    const validValues = new Set(['primaries', 'new_primaries', 'all', 'none', 'null']);

    if (!validValues.has(enabledShards)) {
      logger.error(`Invalid value "${enabledShards}", valid values are : ${Array.from(validValues).join(', ')}`);
      process.exit(1);
    }

    if (enabledShards === 'null') {
      enabledShards = null;
    }

    let response;
    try {
      response = await cluster.setShardAllocation(enabledShards);
    } catch (e) {
      const dataError = e.response && e.response.body && e.response.body.error;
      logger.error('Failed to apply cluster settings');
      logger.error(dataError || e.message);
      process.exit(1);
    }

    const { body } = response;

    if (!body || body.acknowledged !== true) {
      logger.error('Invalid elasticsearch response body');
      logger.error(body);
      process.exit(1);
    }

    logger.info('Cluster settings applied');
    process.exit(0);
  },

  getSettings: async () => {
    let response;
    try {
      response = await cluster.getSettings();
    } catch (e) {
      const dataError = e.response && e.response.body && e.response.body.error;
      logger.error('Failed to get cluster settings');
      logger.error(dataError || e.message);
      process.exit(1);
    }

    const { body } = response;

    console.log(JSON.stringify(body, null, 2));
    process.exit(0);
  },

  flush: async () => {
    let response;
    try {
      response = await cluster.flush();
    } catch (e) {
      const dataError = e.response && e.response.body && e.response.body.error;
      logger.error('Failed to flush cluster');
      logger.error(dataError || e.message);
      process.exit(1);
    }

    const { body } = response;

    if (!body || !body._shards) {
      logger.error('Invalid elasticsearch response body');
      logger.error(body);
      process.exit(1);
    }

    logger.info(`Total: ${body._shards.total}`);
    logger.info(`Successful: ${body._shards.successful}`);
    logger.info(`Failed: ${body._shards.failed}`);

    if (body._shards.failed > 0) {
      logger.error('Some shards failed to flush');
      process.exit(1);
    }

    process.exit(0);
  },
};
