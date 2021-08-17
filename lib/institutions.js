const ezmesure = require('./app/ezmesure');

module.exports = {
  refresh: () => ezmesure.post('/institutions/_refresh'),
  refreshById: (id) => ezmesure.get(`/institutions/${id}/_refresh`),
  create: (data, creator) => ezmesure.post('/institutions', data, {
    params: { creator },
  }),
  delete: (id) => ezmesure.delete(`/institutions/${id}`),
  update: (id, data) => ezmesure.delete(`/institutions/${id}`, data),
  validate: (id, value) => ezmesure.put(`/institutions/${id}/validated`, { value }),
  migrateCreator: (id) => ezmesure.post(`/institutions/${id}/_migrate_creator`),
  getState: (id) => ezmesure.get(`/institutions/${id}/state`),
  getSushi: (id) => ezmesure.get(`/institutions/${id}/sushi`),
  getMembers: (id) => ezmesure.get(`/institutions/${id}/members`),
  updateMember: (id, member, readonly) => ezmesure.put(`/institutions/${id}/members/${member}`, { readonly }),
  deleteMember: (id, member) => ezmesure.delete(`/institutions/${id}/members/${member}`),
  getOne: (id) => ezmesure.get(`/institutions/${id}`),
  getAll: () => ezmesure.get('/institutions'),
};
