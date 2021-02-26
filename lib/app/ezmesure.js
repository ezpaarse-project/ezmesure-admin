const axios = require('axios');
const { config } = require('./config');

module.exports = axios.create({
  timeout: config.timeout || 30000,
  baseURL: config.ezmesure.baseUrl,
  headers: {
    Authorization: `Bearer ${config.ezmesure.token}`,
    'User-Agent': 'ezmesure-admin',
  },
  proxy: config.proxy || false,
});
