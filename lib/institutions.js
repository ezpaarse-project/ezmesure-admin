const ezmesure = require('./app/ezmesure');

module.exports = {
  create: (data) => ezmesure.post('/institutions', data),
  delete: (id) => ezmesure.delete(`/institutions/${id}`),
  update: (id, data) => ezmesure.delete(`/institutions/${id}`, data),
  validate: (id, value) => ezmesure.put(`/institutions/${id}/validated`, { value }),
  getState: (id) => ezmesure.get(`/institutions/${id}/state`),
  getSushi: (id, params = {}) => ezmesure.get(`/institutions/${id}/sushi`, { params: { size: 0, ...params } }),
  getMembers: (id, params = {}) => ezmesure.get(`/institutions/${id}/memberships/`, { params: { size: 0, ...params } }),
  updateMember: (id, member, readonly) => ezmesure.put(`/institutions/${id}/memberships/${member}`, { readonly }),
  deleteMember: (id, member) => ezmesure.delete(`/institutions/${id}/memberships/${member}`),
  getOne: (id) => ezmesure.get(`/institutions/${id}`),
  getSelf: (value) => ezmesure.get('/institutions/self', { value }),
  getAll: (params = {}) => ezmesure.get('/institutions', { params: { size: 0, ...params } }),
  import: (data, opts) => ezmesure.post('/institutions/_import', data, opts),
};
