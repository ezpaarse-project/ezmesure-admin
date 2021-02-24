const axios = require('axios');
const { config } = require('./config');

module.exports = axios.create({
  timeout: config.timeout || 30000,
  baseURL: config.baseUrl,
  headers: {
    Authorization: `Bearer ${config.token}`,
    'User-Agent': 'ezmesure-admin',
  },
});
