const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params) => ezmesure.get('/kibana-spaces', { params }),
  findById: (id) => ezmesure.get(`/kibana-spaces/${id}`),
  create: (space) => ezmesure.post('/kibana-spaces', space),
  update: (spaceId, space) => ezmesure.put(`/kibana-spaces/${spaceId}`, space),
  delete: (spaceId) => ezmesure.delete(`/kibana-spaces/${spaceId}`),
  getIndexPatterns: (spaceId) => ezmesure.get(`/kibana-spaces/${spaceId}/index-patterns`),
  addIndexPatterns: (spaceId, data) => ezmesure.post(`/kibana-spaces/${spaceId}/index-patterns`, data),
};
