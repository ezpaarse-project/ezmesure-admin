const ezmesure = require('./app/ezmesure');

module.exports = {
  create: (body, params) => ezmesure.post('/harvests-sessions', body, { params }),
  upsert: (id, body, params) => ezmesure.put(`/harvests-sessions/${id}`, body, { params }),
  getOne: (id) => ezmesure.get(`/harvests-sessions/${id}`),
  delete: (id) => ezmesure.delete(`/harvests-sessions/${id}`, { timeout: 0 }),
  start: (id, opts = {}) => ezmesure.post(`/harvests-sessions/${id}/_start`, opts, { timeout: 0 }),
  stop: (id) => ezmesure.post(`/harvests-sessions/${id}/_stop`, undefined, { timeout: 0 }),
  getStatuses: (ids) => ezmesure.get('/harvests-sessions/status', { params: { harvestIds: ids } }),
  getCredentials: (id, params) => ezmesure.get(`/harvests-sessions/${id}/credentials`, { params }),
};
