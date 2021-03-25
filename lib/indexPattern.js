const client = require('./app/elastic');

const indexPattern = {};

indexPattern.findAll = () => client.search({
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
});

module.exports = indexPattern;
