'use strict';

exports.elkConfig = {
  'elasticsearchUrl':  process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  'elasticsearchUser': process.env.ELASTICSEARCH_USERNAME || 'elastic',
  'elasticsearchPassword': process.env.ELASTICSEARCH_PASSWORD || 'changeme',
  'kibanaUrl': process.env.KIBANA_URL || 'http://localhost:5601'
};
