const axios = require('axios');
const config = require('config');
const { token, ezmesureApiUrl } = require('config');

module.exports = axios.create({
  timeout: config.timeout || 100000,
  baseURL: ezmesureApiUrl,
  headers: {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'ezmesure-admin',
  },
});
