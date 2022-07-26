const ezmesure = require('./app/ezmesure');

module.exports = {
  create: (id, params) => ezmesure.put(`/indices/${id}`, undefined, { params }),
  getById: (id) => ezmesure.get(`/indices/${id}`),
  delete: (id) => ezmesure.delete(`/indices/${id}`),
};
