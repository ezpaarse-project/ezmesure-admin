const client = require('./app/elastic');
const { config, watch } = require('./app/config');

const frequencies = {
  weekly: '1w',
  monthly: '1M',
  quarterly: 'quarterly',
  'semi-annual': 'semiannual',
  annual: '1y',
};

watch(['index.reporting']);

module.exports = {
  findAll: async () => client.search({
    index: config.index.reporting,
    size: 10000,
  }),

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

  findByFrequency: async (opts) => {
    const frequenciesSelected = [];

    opts.forEach((frequency) => {
      if (frequencies[frequency]) {
        frequenciesSelected.push(frequencies[frequency]);
      }
    });

    return client.search({
      index: config.index.reporting,
      size: 10000,
      body: {
        query: {
          bool: {
            should: frequenciesSelected.map((frequency) => ({
              match: {
                frequency,
              },
            })),
          },
        },
      },
    });
  },

  findHistoryById: (taskId) => client.search({
    index: `${config.index.reporting}-history`,
    size: 10000,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                taskId,
              },
            },
          ],
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
