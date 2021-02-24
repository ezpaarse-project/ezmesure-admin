const { Client } = require('@elastic/elasticsearch');
const { URL } = require('url');
const { config } = require('./config');

const client = new Client({
  node: {
    url: new URL(config.esBaseUrl),
    auth: {
      username: config.esUser,
      password: config.esPassword,
    },
  },
});

module.exports = client;
