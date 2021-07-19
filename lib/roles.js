const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: (reserved) => ezmesure.get('/roles', {
    params: { reserved },
  }),
  findByName: (role) => ezmesure.get(`/roles/${role}`),
  createOrUpdate: (role, data) => ezmesure.put(`/roles/${role}`, data),
  delete: (role) => ezmesure.delete(`/roles/${role}`),
};
