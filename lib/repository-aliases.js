const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params = {}) => ezmesure.get('/repository-aliases', { params: { size: 0, ...params } }),
  import: (data, opts) => ezmesure.post('/repository-aliases/_import', data, opts),
};
