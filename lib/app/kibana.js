const axios = require('axios');
const { config } = require('./config');

module.exports = axios.create({
  auth: {
    username: config.elastic.user,
    password: config.elastic.pass,
  },
  timeout: config.timeout || 30000,
  baseURL: config.kibana.baseUrl,
  headers: { 'kbn-xsrf': 'true' },
});
