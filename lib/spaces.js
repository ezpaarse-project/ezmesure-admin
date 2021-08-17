const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: () => ezmesure.get('/spaces'),
  findById: (id) => ezmesure.get(`/spaces/${id}`),
  create: (space) => ezmesure.post('/spaces', space),
  update: (spaceId, space) => ezmesure.put(`/spaces/${spaceId}`, space),
  getIndexPatterns: (spaceId) => ezmesure.get(`/spaces/${spaceId}/index-patterns`),
  addIndexPatterns: (spaceId, data) => ezmesure.post(`/spaces/${spaceId}/index-patterns`, data),
};
