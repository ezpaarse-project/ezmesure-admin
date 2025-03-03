const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params = {}) => ezmesure.get('/elastic-roles', { params: { size: 0, ...params } }),
  import: (data, opts) => ezmesure.post('/elastic-roles/_import', data, opts),
};
