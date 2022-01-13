const ezmesure = require('./app/ezmesure');

module.exports = {
  getAll: () => ezmesure.get('/tasks'),
  findById: (id) => ezmesure.get(`/tasks/${id}`),
};
