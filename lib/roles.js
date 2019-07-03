const config = require('config');
const instance = require('./app/api');

module.exports = {
  getRoles: role => instance.get(role ? (`${config.elasticsearchUrl}/_security/role/${role}`) : `${config.elasticsearchUrl}/_security/role`),

  createRole: (role, data) => instance.post(`${config.elasticsearchUrl}/_security/role/${role}`, data),
};
