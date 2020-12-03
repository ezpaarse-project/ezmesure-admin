const config = require('config');
const instance = require('./app/api');
const client = require('./app/elastic');

module.exports = {
  getRoles: role => client.security.getRole(role ? { name: role } : {}),

  createRole: (role, data) => client.security.putRole({
    name: role,
    refresh: true,
    body: data,
  }),

  deleteRole: role => client.security.deleteRole({
    name: role,
    refresh: true,
  }),

  updateRole: (role, data) => client.security.putRole({
    name: role,
    refresh: true,
    body: data,
  }),
};
