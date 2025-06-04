const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params = {}) => ezmesure.get('/custom-fields', { params: { size: 0, ...params } }),
  import: (data, opts) => ezmesure.post('/custom-fields/_import', data, opts),
};
