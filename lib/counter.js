/* eslint-disable max-len */
const client = require('./app/elastic');
const logger = require('./app/logger');

module.exports = {
  insertIndex: (publisherIndex, id, journalJR1) => client.index({
    id,
    index: publisherIndex,
    body: journalJR1,
  }),

  bulkInsertIndex: async (publisherIndex, flatJR1) => {
    // curl --proxy "" -XPOST "${ELASTICSEARCH_URL}/${PUBLISHER_INDEX}/journal?pipeline=parse_JR1_csv"
    // -H "Content-Type: application/json" -u ${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD} -d "{ \"journal\": \"$line\" }"

    const bulkSize = 2000;
    const nbPackets = Math.ceil(flatJR1.length / bulkSize);
    const nowExec = Date.now();

    let itemsInserted = 0;
    let itemsUpdated = 0;
    let itemsDeleted = 0;
    let itemsErrors = 0;

    for (let i = 0; i < nbPackets; i += 1) {
      const bulk = [];
      const rows = flatJR1.slice(i * bulkSize, i + bulkSize);

      rows.forEach((row) => {
        bulk.push({ index: { _index: publisherIndex, _id: row._id } });
        bulk.push(row);
      });

      logger.info(`Envoi de ${(rows.length)} metriques a l'index ${publisherIndex}`);

      const { body } = await client.bulk(bulk);

      if (!body) {
        return Promise.reject(new Error('elasticsearch responded without body'));
      }

      if (body.errors) {
        console.log(JSON.stringify(body, null, 2));
        itemsErrors += body.errors;
      }

      const items = Array.isArray(body && body.items) ? body.items : [];

      for (let j = 0; j < items.length; j += 1) {
        const item = items[j];
        if (item.index.result === 'updated') { itemsUpdated += 1; }
        if (item.index.result === 'created') { itemsInserted += 1; }
        if (item.index.result === 'deleted') { itemsDeleted += 1; }
      }
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
