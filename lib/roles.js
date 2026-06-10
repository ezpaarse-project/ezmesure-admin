const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: () => ezmesure.get('/roles'),
  createOrUpdate: (role, data) => ezmesure.put(`/roles/${role}`, data),
  delete: (role) => ezmesure.delete(`/roles/${role}`),
  import: (data, opts) => ezmesure.post('/roles/_import', data, opts),
};
