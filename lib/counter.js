/* eslint-disable max-len */
const config = require('config');
const instance = require('./app/api');
const client = require('./app/elastic');

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

    const bulkSize = 2000;
    const nbPackets = Math.ceil(flatJR1.length / bulkSize);
    const nowExec = Date.now();
    let start = 0;
    let end;
    let itemsInserted = 0;
    let itemsUpdated = 0;
    let itemsDeleted = 0;
    let itemsErrors = 0;

    for (let n = 0; n < nbPackets; n += 1) {
      let body;
      start = n * bulkSize;
      end = (n + 1) * bulkSize;

      if (n === (nbPackets - 1)) {
        end = flatJR1.length;
      }

      for (let i = start; i < end; i += 1) {
        body += `{ "index" : { "_index" : "${publisherIndex}", "_id" : "${flatJR1[i]._id}" } }\r\n`;
        delete flatJR1[i]._id;
        body += JSON.stringify(flatJR1[i]);
        body += '\r\n';
      }
      //  console.log(body);
      const url = `${config.elasticsearchUrl}/_bulk`;
      console.log('Envoi de', end - start, 'metriques a l\'index', publisherIndex);
      const { data: rep } = await instance.post(url, body, { headers: { 'Content-Type': 'application/json' } });


      /** Refait */
      if (!rep) {
        return Promise.reject();
      }

      if (rep.errors) {
        console.log(JSON.stringify(rep));
        itemsErrors += rep.errors;
      }
      
      rep.items.forEach((el) => {
        if (el.index.result === 'updated') { itemsUpdated += 1; }
        if (el.index.result === 'created') { itemsInserted += 1; }
        if (el.index.result === 'deleted') { itemsDeleted += 1; }
      });
      /** Refait */


      /** CODE DOM */
      if (rep) {
        if (rep.errors) {
          console.log(JSON.stringify(rep));
          itemsErrors += rep.errors;
        } else {
          for (let i = 0; i < rep.items.length; i += 1) {
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
        // console.log(itemsInserted, itemsUpdated, itemsDeleted, itemsErrors);
      }
      /** CODE DOM */
    }
    return {
      took: Date.now() - nowExec,
      inserted: itemsInserted,
      updated: itemsUpdated,
      deleted: itemsDeleted,
      errors: itemsErrors,
    };
  },
};
