const axios = require('axios');
const config = require('config');
const { token, ezmesureUrl } = require('config');

module.exports = axios.create({
  timeout: config.timeout || 100000,
  baseURL: `${ezmesureUrl}/api`,
  headers: {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'ezmesure-admin',
  },
});
