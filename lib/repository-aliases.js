const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params = {}) => ezmesure.get('/repository-aliases', { params: { size: 0, ...params } }),
  import: (data, opts) => ezmesure.post('/repository-aliases/_import', data, opts),
  getAllTemplates: (params = {}) => ezmesure.get('/repository-alias-templates', { params: { size: 0, ...params } }),
  importTemplates: (data, opts) => ezmesure.post('/repository-alias-templates/_import', data, opts),
};
