/* eslint-disable max-len */
const ezmesure = require('./app/ezmesure');

module.exports = {
  import: (data, opts) => ezmesure.post('/sushi-endpoints/_import', data, opts),
};
