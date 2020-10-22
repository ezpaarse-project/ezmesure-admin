const { institutionsIndex } = require('config');
const client = require('./app/elastic');

module.exports = {
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
