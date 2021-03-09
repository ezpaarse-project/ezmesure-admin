const client = require('./app/elastic');
const { config } = require('./app/config');

module.exports = {
  findBySpace: async (space) => client.search({
    index: config.index.reporting,
    size: 10000,
    body: {
      query: {
        bool: {
          must: [{
            match: {
              space,
            },
          }],
        },
      },
    },
  }),

  delete: async (tasksId) => client.bulk({
    body: tasksId.map((taskId) => ({
      delete: {
        _index: config.index.reporting,
        _id: taskId,
      },
    })),
  }),
};
