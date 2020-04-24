/* eslint-disable no-plusplus */
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

    const lot = 2000; let start = 0; let end;
    const boucles = Math.ceil(flatJR1.length / lot);
    let itemsInserted = 0;
    let itemsUpdated = 0;
    let itemsDeleted = 0;
    let itemsErrors = 0;
    // eslint-disable-next-line no-plusplus
    let body;
    for (let n = 0; n < boucles; n++) {
      body = '';
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
      //  console.log(body);
      const url = `${config.elasticsearchUrl}/_bulk`;
      console.log('Envoi de', end - start, 'metriques a l\'index', publisherIndex);
      console.log(body.length);
      const { data: rep } = await instance.post(url, body, { headers: { 'Content-Type': 'application/json' } });
      if (rep) {
        if (rep.errors) {
          console.log(JSON.stringify(rep));
          itemsErrors += rep.errors;
        } else {
          for (let i = 0; i < rep.items.length; i++) {
            if (rep.items[i].index.result === 'updated') {
              itemsUpdated += 1;
            } else if (rep.items[i].index.result === 'created') {
              itemsInserted += 1;
            } else if (rep.items[i].index.result === 'deleted') {
              itemsDeleted += 1;
            }
          }
          // console.log(JSON.stringify(rep));
        }
        console.log(itemsInserted, itemsUpdated, itemsDeleted, itemsErrors);
      }
    }
    return {
      inserted: itemsInserted, updated: itemsUpdated, deleted: itemsDeleted, erros: itemsErrors,
    };
  },
};
