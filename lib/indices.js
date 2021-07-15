const ezmesure = require('./app/ezmesure');

module.exports = {
  create: (id) => ezmesure.put(`/indices/${id}`),
  getById: (id) => ezmesure.get(`/indices/${id}`),
};
