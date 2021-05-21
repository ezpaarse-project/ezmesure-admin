const client = require('./app/elastic');

module.exports = {
  findAll: () => client.security.getUser(),

  findByName: (user) => client.security.getUser({
    username: user,
  }),

  update: (user) => client.security.putUser({
    username: user.username,
    refresh: true,
    body: user,
  }),
};
