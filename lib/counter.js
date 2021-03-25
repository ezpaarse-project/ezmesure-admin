const chalk = require('chalk');
const client = require('./app/elastic');
const logger = require('./app/logger');

module.exports = {
  insertIndex: (publisherIndex, id, journalJR1) => client.index({
    id,
    index: publisherIndex,
    body: journalJR1,
  }),

  bulkInsertIndex: async (publisherIndex, flatJR1) => {
    const bulkSize = 2000;
    const nbPackets = Math.ceil(flatJR1.length / bulkSize);
    const nowExec = Date.now();

    let itemsInserted = 0;
    let itemsUpdated = 0;
    let itemsDeleted = 0;
    let itemsErrors = 0;

    const bulk = [];

    flatJR1.forEach(({ _id, doc }) => {
      bulk.push({ index: { _index: publisherIndex, _id } });
      bulk.push(doc);
    });

    console.log(`Send ${(chalk.bold(flatJR1.length))} metrics to index ${chalk.bold(publisherIndex)}`);

    const { body } = await client.bulk({ body: bulk });

    const items = Array.isArray(body && body.items) ? body.items : [];

    for (let j = 0; j < items.length; j += 1) {
      const item = items[j];
      if (item.index.result === 'updated') { itemsUpdated += 1; }
      if (item.index.result === 'created') { itemsInserted += 1; }
      if (item.index.result === 'deleted') { itemsDeleted += 1; }
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
