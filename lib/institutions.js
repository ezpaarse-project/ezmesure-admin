const { config } = require('./app/config');
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
    index: config.institutionsIndex,
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

  getInstitution: (name) => client.search({
    index: config.institutionsIndex,
    size: 10000,
    body: {
      query: {
        bool: {
          filter: [{
            term: {
              type: 'institution',
            },
          }],
          must: [{
            match: {
              'institution.name': name,
            },
          }],
        },
      },
    },
  }),

  delInstitutions: (id) => client.delete({
    id,
    index: config.institutionsIndex,
    refresh: true,
  }),

  addInstitutions: (id, doc) => client.index({
    index: config.institutionsIndex,
    id,
    refresh: true,
    body: {
      ...doc,
    },
  }),

  importInstitution: (institutionDoc, sushiDocs) => {
    const bulk = [];

    bulk.push({ index: { _index: config.institutionsIndex, _id: `${institutionDoc._id}` } });
    delete institutionDoc.doc._id;
    bulk.push({ type: institutionDoc.type, institution: institutionDoc.doc });

    sushiDocs.forEach((sushi) => {
      bulk.push({ index: { _index: config.institutionsIndex, _id: `${sushi._id}` } });
      delete institutionDoc.doc._id;
      bulk.push({ type: sushi.type, sushi: sushi.doc });
    });

    return client.bulk({ body: bulk });
  },
};
