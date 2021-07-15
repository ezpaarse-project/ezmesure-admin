const client = require('./app/elastic');
const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: () => ezmesure.get('/users'),
  getByUsername: (username) => ezmesure.get(`/users/${username}`),
  update: (user) => client.security.putUser({
    username: user.username,
    refresh: true,
    body: user,
  }),
};
