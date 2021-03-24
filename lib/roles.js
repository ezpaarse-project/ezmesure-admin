const client = require('./app/elastic');

module.exports = {
  findAll: () => client.security.getRole(),

  findByName: (role) => {
    if (!role) { return Promise.reject(new Error('No role specified')); }
    return client.security.getRole({ name: role });
  },

  create: (role, data) => client.security.putRole({
    name: role,
    refresh: true,
    body: data,
  }),

  delete: (role) => client.security.deleteRole({
    name: role,
    refresh: true,
  }),

  update: (role, data) => client.security.putRole({
    name: role,
    refresh: true,
    body: data,
  }),
};
