const { Client } = require('@elastic/elasticsearch');
const { elasticsearchUrl, elasticsearchUser, elasticsearchPassword } = require('config');
const { URL } = require('url');

const client = new Client({
  node: {
    url: new URL(elasticsearchUrl),
    auth: {
      username: elasticsearchUser,
      password: elasticsearchPassword,
    },
  },
});

module.exports = client;
