/* eslint-disable max-len */
const ezmesure = require('./app/ezmesure');

module.exports = {
  import: (data) => ezmesure.post('/sushi-endpoints/_import', data),
};
