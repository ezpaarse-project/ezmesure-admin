const axios = require('axios');
const { config } = require('./config');
const { name, version } = require('../../package.json');

module.exports = axios.create({
  timeout: config.timeout || 3000,
  baseURL: config.ezmesure.baseUrl,
  headers: {
    Authorization: `Bearer ${config.ezmesure.token}`,
    'User-Agent': `${name}-${version}`,
  },
});
