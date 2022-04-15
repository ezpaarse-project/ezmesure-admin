const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params) => ezmesure.get('/queues', { params }),
  findById: (id) => ezmesure.get(`/queues/${id}`),
  pause: (id) => ezmesure.post(`/queues/${id}/_pause`),
  resume: (id) => ezmesure.post(`/queues/${id}/_resume`),
};
