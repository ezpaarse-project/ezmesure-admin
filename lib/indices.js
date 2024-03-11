const ezmesure = require('./app/ezmesure');

module.exports = {
  create: (id, params) => ezmesure.put(`/indices/${id}`, undefined, { params }),
  search: (id, body) => ezmesure.post(`/logs/${id}/search`, body),
  aggregate: (id, format, options) => ezmesure.get(`/logs/${id}/aggregation.${format}`, options),
  getById: (id) => ezmesure.get(`/indices/${id}`),
  delete: (id) => ezmesure.delete(`/indices/${id}`),
};
