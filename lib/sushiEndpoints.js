/* eslint-disable max-len */
const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (opts) => ezmesure.get('/sushi-endpoints', opts),
  import: (data, opts) => ezmesure.post('/sushi-endpoints/_import', data, opts),
};
