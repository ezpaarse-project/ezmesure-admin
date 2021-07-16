const client = require('./app/elastic');
const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: (reserved) => ezmesure.get(`roles${reserved ? '?reserved=true' : ''}`),
  findByName: (role) => ezmesure.get(`/roles/${role}`),
  createOrUpdate: (role, data) => ezmesure.put(`/roles/${role}`, data),

  delete: (role) => client.security.deleteRole({ name: role, refresh: true }),
};
