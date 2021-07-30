const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: () => ezmesure.get('/users'),
  getByUsername: (username) => ezmesure.get(`/users/${username}`),
  createOrUpdate: (username, data) => ezmesure.put(`/users/${username}`, data),
};
