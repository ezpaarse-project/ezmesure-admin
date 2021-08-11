const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: (params) => ezmesure({
    method: 'GET',
    url: '/users',
    params,
  }),
  getByUsername: (username) => ezmesure.get(`/users/${username}`),
  createOrUpdate: (username, data) => ezmesure.put(`/users/${username}`, data),
};
