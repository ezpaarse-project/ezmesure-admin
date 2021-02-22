const axios = require('axios');
const scopes = require('./config').getScopes();

module.exports = axios.create({
  timeout: scopes.config.timeout || 3000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ezmesure-admin',
  },
});
