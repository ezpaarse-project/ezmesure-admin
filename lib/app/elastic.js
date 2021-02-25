const { Client } = require('@elastic/elasticsearch');
const { URL } = require('url');
const { config } = require('./config');

const client = new Client({
  node: {
    url: new URL(config.elastic.baseUrl),
    auth: {
      username: config.elastic.user,
      password: config.elastic.pass,
    },
  },
});

module.exports = client;
