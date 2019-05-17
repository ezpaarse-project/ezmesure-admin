const config = require('config');
const axios = require('axios');

module.exports = axios.create({
  auth: {
    username: config.elasticsearchUser,
    password: config.elasticsearchPassword,
  },
  timeout: config.timeout || 5000,
  headers: { 'kbn-xsrf': 'true' },
  proxy: false,
});
