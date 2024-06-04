/* eslint-disable max-len */
const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params = {}) => ezmesure.get('/sushi-endpoints', { params: { size: 0, ...params } }),
  getOne: (id) => ezmesure.get(`/sushi-endpoints/${id}`),
  delete: (id) => ezmesure.delete(`/sushi-endpoints/${id}`),
  add: (data) => ezmesure.post('/sushi-endpoints', data),
  update: (endpointId) => ezmesure.patch(`/sushi-endpoints/${endpointId}`),
  import: (data, opts) => ezmesure.post('/sushi-endpoints/_import', data, opts),
};
