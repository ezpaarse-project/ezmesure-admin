const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params = {}) => ezmesure.get('/repositories', { params: { size: 0, ...params } }),
  import: (data, opts) => ezmesure.post('/repositories/_import', data, opts),
};
