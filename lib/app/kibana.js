const axios = require('axios');
const scopes = require('./config').getScopes();

module.exports = axios.create({
  auth: {
    username: scopes.config.esUser,
    password: scopes.config.esPassword,
  },
  timeout: scopes.config.timeout || 30000,
  baseURL: scopes.config.kbnBaseUrl,
  headers: { 'kbn-xsrf': 'true' },
  proxy: false,
});
