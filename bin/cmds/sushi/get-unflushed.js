const { i18n } = global;

const { createStream } = require('table');

const sushiLib = require('../../../lib/sushi');
const indicesLib = require('../../../lib/indices');
const { config } = require('../../../lib/app/config');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'get-unflushed';
exports.desc = i18n.t('sushi.getUnflushed.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('i', {
      alias: 'index',
      describe: i18n.t('sushi.getUnflushed.options.index'),
      type: 'string',
      required: true,
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('sushi.getUnflushed.options.ndjson'),
      type: 'boolean',
    })
    .option('t', {
      alias: 'agg-timeout',
      describe: i18n.t('sushi.getUnflushed.options.aggregationTimeout'),
      type: 'number',
      default: 30000,
    });
};
exports.handler = async function handler(argv) {
  const { verbose, index, aggTimeout } = argv;

  if (verbose) {
    console.log(`* Aggregating X_Sushi_ID from the index ${index} of ${config.ezmesure.baseUrl}`);
  }

  /**
   * @typedef {object} SushiAggregationItem
   * @property {object} key
   * @property {string | null} key.X_Sushi_ID
   * @property {string | null} key._index
   * @property {number} doc_count
   */

  /** @type {SushiAggregationItem[]} */
  let sushiAggregation;

  try {
    const { data } = await indicesLib.aggregate(index, 'ndjson', { params: { fields: 'X_Sushi_ID,_index' }, timeout: aggTimeout });

    sushiAggregation = data
      ?.split('\n')
      .filter((x) => x)
      .map(JSON.parse);
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  if (!Array.isArray(sushiAggregation)) {
    console.error(i18n.t('sushi.getUnflushed.invalidAggregationResult'));
    process.exit(1);
  }

  if (verbose) {
    console.log(`* Retrieving SUSHI platforms from ${config.ezmesure.baseUrl}`);
  }

  const pageSize = 100;
  const nbPages = Math.ceil(sushiAggregation.length / pageSize);

  const tableStream = !argv.ndjson && createStream({
    columnDefault: { width: 50 },
    columnCount: 3,
    columns: [
      { width: 40 },
      { width: 15, alignment: 'right' },
      { width: 60 },
    ],
  });

  if (tableStream) {
    tableStream.write(['X_Sushi_ID', 'Doc. count', 'Index']);
  }

  for (let page = 0; page < nbPages; page += 1) {
    const sushiIdsToCheck = sushiAggregation.slice(page * pageSize, (page + 1) * pageSize);
    let sushiItems;

    try {
      const { data } = await sushiLib.getAll({
        id: sushiIdsToCheck.map((s) => s.key.X_Sushi_ID),
      });

      if (!Array.isArray(data)) {
        console.error(i18n.t('sushi.getUnflushed.invalidSushiResponse'));
        process.exit(1);
      }

      sushiItems = data;
    } catch (e) {
      console.error(formatApiError(e));
      process.exit(1);
    }

    const existingSushiIds = new Set(sushiItems.map((item) => item.id));

    sushiIdsToCheck
      .filter((sushi) => !existingSushiIds.has(sushi.key.X_Sushi_ID))
      .forEach((sushi) => {
        if (tableStream) {
          tableStream.write([sushi.key.X_Sushi_ID, sushi.doc_count, sushi.key._index]);
        } else {
          console.log(JSON.stringify({
            sushiId: sushi.key.X_Sushi_ID,
            index: sushi.key._index,
            docCount: sushi.doc_count,
          }));
        }
      });
  }
};
