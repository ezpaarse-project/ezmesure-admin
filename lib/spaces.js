const ezmesure = require('./app/ezmesure');

module.exports = {
  findAll: () => ezmesure.get('/spaces'),
  findById: (id) => ezmesure.get(`/spaces/${id}`),
  create: (space) => ezmesure.post('/spaces', space),
  getIndexPatterns: (id) => ezmesure.get(`/spaces/${id}/index-patterns`),
  addIndexPatterns: (id, data) => ezmesure.post(`/spaces/${id}/index-patterns`, data),
};
