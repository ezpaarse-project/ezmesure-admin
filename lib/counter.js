const client = require('./app/elastic');

module.exports = {
  insertIndex: (publisherIndex, id, journalJR1) => client.index({
    id,
    index: publisherIndex,
    body: journalJR1,
  }),
  bulkInsertIndex: async (publisherIndex, flatJR1, packageName) => {
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

    const { body } = await client.bulk({ body: bulk });

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

    return Promise.resolve({
      publisherIndex,
      packageName,
      took: Date.now() - nowExec,
      inserted: itemsInserted,
      updated: itemsUpdated,
      deleted: itemsDeleted,
      errors: itemsErrors,
      total: flatJR1.length,
    });
  },
};
