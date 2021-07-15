const client = require('./app/elastic');

module.exports = {
  findAll: () => client.search({
    index: '.kibana',
    size: 10000,
    body: {
      query: {
        bool: {
          filter: [{
            term: {
              type: 'index-pattern',
            },
          }],
        },
      },
    },
  }),
};
