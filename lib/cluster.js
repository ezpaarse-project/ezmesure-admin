const client = require('./app/elastic');

module.exports = {
  setShardAllocation: enabledShards => client.cluster.putSettings({
    body: {
      persistent: {
        'cluster.routing.allocation.enable': enabledShards,
      },
    },
  }),

  flush: () => client.indices.flush(),

  getSettings: () => client.cluster.getSettings(),
};
