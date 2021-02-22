const { Client } = require('@elastic/elasticsearch');
const { URL } = require('url');
const scopes = require('./config').getScopes();

const client = new Client({
  node: {
    url: new URL(scopes.config.esBaseUrl),
    auth: {
      username: scopes.config.esUser,
      password: scopes.config.esPassword,
    },
  },
});

module.exports = client;
