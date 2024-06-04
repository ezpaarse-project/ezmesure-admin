/* eslint-disable max-len */
const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params = {}) => ezmesure.get('/sushi-endpoints', { params: { size: 0, ...params } }),
  import: (data, opts) => ezmesure.post('/sushi-endpoints/_import', data, opts),
};
