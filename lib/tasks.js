const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: (params) => ezmesure.get('/tasks', { params }),
  findById: (id) => ezmesure.get(`/tasks/${id}`),
};
