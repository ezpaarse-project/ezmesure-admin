const client = require('../app/elastic');

const indexPattern = {};

indexPattern.findById = (space, indexPindexPatternId) => client.getSource({
  index: '.kibana',
  id: `${space ? `${space}:` : ''}index-pattern:${indexPindexPatternId}`,
});

module.exports = indexPattern;
