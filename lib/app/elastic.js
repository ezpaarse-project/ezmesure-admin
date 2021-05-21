const { Client } = require('@elastic/elasticsearch');
const { URL } = require('url');
const { config, watch } = require('./config');

let client;
try {
  client = new Client({
    node: {
      url: new URL(config.elastic.baseUrl),
      auth: {
        username: config.elastic.user,
        password: config.elastic.pass,
      },
    },
  });
} catch (e) {
  console.error(`[Elastic] ${e.message}`);
  watch(['elastic.baseUrl', 'elastic.user', 'elastic.pass']);
  process.exit(1);
}

module.exports = client;
