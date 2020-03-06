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
  bulkInsertIndex: async (publisherIndex, flatJR1) => {
    // curl --proxy "" -XPOST "${ELASTICSEARCH_URL}/${PUBLISHER_INDEX}/journal?pipeline=parse_JR1_csv"
    // -H "Content-Type: application/json" -u ${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD} -d "{ \"journal\": \"$line\" }"

    const lot = 1000; let start = 0; let end; let maj = 0;
    const boucles = Math.ceil(flatJR1.length / lot);
    // eslint-disable-next-line no-plusplus
    for (let n = 0; n < boucles; n++) {
      let body = '';
      start = n * lot;
      end = (n + 1) * lot;
      if (n === (boucles - 1)) { end = flatJR1.length; }
      // eslint-disable-next-line no-plusplus
      for (let i = start; i < end; i++) {
        body += `{ "index" : { "_index" : "${publisherIndex}", "_id" : "${flatJR1[i]._id}" } }\r\n`;
        delete flatJR1[i]._id;
        body += JSON.stringify(flatJR1[i]);
        body += '\r\n';
      }
      //console.log(body);
      const url = `${config.elasticsearchUrl}/_bulk`;
      //console.log(url);
      const { data: rep } = await instance.post(url, body, { headers: { 'Content-Type': 'application/json' } });
      if (rep) {
        if (rep.errors) {
          console.log(JSON.stringify(rep));
        } else {
          maj += rep.items.length;
        }
      }
    }
    return maj;
  },
};
