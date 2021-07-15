const client = require('./app/elastic');
const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: () => ezmesure.get('/roles'),
  findByName: (role) => ezmesure.get(`/roles/${role}`),
  createOrUpdate: (role, data) => ezmesure.put(`/roles/${role}`, data),

  delete: (role) => client.security.deleteRole({ name: role, refresh: true }),
};
