const { institutionsIndex } = require('config');
const client = require('./app/elastic');
const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: async (options) => {
    const query = {
      method: 'GET',
      url: '/institutions',
    };

    if (options) {
      if (options.timeout) { query.timeout = options.timeout; }
      if (options.token) {
        query.headers = {
          Authorization: `Bearer ${options.token}`,
        };
      }
    }

    return ezmesure(query);
  },

  getInstitutions: () => client.search({
    index: institutionsIndex,
    size: 10000,
    body: {
      query: {
        bool: {
          filter: [{
            term: {
              type: 'institution',
            },
          }],
        },
      },
    },
  }),

  delInstitutions: id => client.delete({
    id,
    index: institutionsIndex,
    refresh: true,
  }),

  addInstitutions: (id, doc) => client.index({
    index: institutionsIndex,
    id,
    refresh: true,
    body: {
      ...doc,
    },
  }),
};
