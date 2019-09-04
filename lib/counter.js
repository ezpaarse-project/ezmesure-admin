/* eslint-disable max-len */
const config = require('config');
const instance = require('./app/api');

module.exports = {
  insertIndex: async (publisherIndex, id, journalJR1) => {
    // curl --proxy "" -XPOST "${ELASTICSEARCH_URL}/${PUBLISHER_INDEX}/journal?pipeline=parse_JR1_csv"
    // -H "Content-Type: application/json" -u ${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD} -d "{ \"journal\": \"$line\" }"

    const url = `${config.elasticsearchUrl}/${publisherIndex}/journal/${id}`;
    instance.dataType = 'json';
    return instance.put(url, journalJR1, { headers: { 'Content-Type': 'application/json' } });
  },
};
