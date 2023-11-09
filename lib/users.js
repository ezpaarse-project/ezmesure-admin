const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params) => ezmesure({
    method: 'GET',
    url: '/users',
    params,
  }),
  getByUsername: (username) => ezmesure.get(`/users/${username}`),
  getInstitutionByUsername: (username) => ezmesure.get(`/users/${username}/institution`),
  createOrUpdate: (username, data) => ezmesure.put(`/users/${username}`, data),
  activate: (username, data) => ezmesure.put('/profile/_activate', data),
  delete: (username) => ezmesure.delete(`/users/${username}`),
  import: (data) => ezmesure.post('/users/_import', data),
};
