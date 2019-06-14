const config = require('config');
const instance = require('./app/api');

module.exports = {
  getUsers: user => instance.get(user ? (`${config.elasticsearchUrl}/_security/user/${user}`) : `${config.elasticsearchUrl}/_security/user`),

  update: (user, data) => instance.put(`${config.elasticsearchUrl}/_security/user/${user}`, data),
};
