const client = require('../app/elastic');

const visualization = {};

visualization.findById = (space, visualizationId) => client.getSource({
  index: '.kibana',
  id: `${space ? `${space}:` : ''}visualization:${visualizationId}`,
});

module.exports = visualization;
