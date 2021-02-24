const client = require('./app/elastic');

module.exports = {
  getUsers: (user) => client.security.getUser({
    username: user || [],
  }),

  update: (user) => client.security.putUser({
    username: user.username,
    refresh: true,
    body: user,
  }),
};
