const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: () => ezmesure.get('/users'),
  getByUsername: (username) => ezmesure.get(`/users/${username}`),
  update: (username, data) => ezmesure.put(`/users/${username}`, data),
};
