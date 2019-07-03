const config = require('config');
const instance = require('./app/api');

module.exports = {
  getIndicies: () => instance.get(`${config.elasticsearchUrl}/_cat/indices?h=index`),
};
