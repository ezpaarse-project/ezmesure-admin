const instance = require('./app/api');

module.exports = {
  getUsers: user => instance.get(user ? (`_security/user/${user}`) : '_security/user'),
};
