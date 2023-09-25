const { i18n } = global;

const { table } = require('table');
const get = require('lodash.get');

const { config } = require('../../../lib/app/config');
const institutionsLib = require('../../../lib/institutions');
const sushiLib = require('../../../lib/sushi');
const { formatApiError } = require('../../../lib/utils');
const itMode = require('./interactive/info');

exports.command = 'list [institutionIds...]';
exports.desc = i18n.t('sushi.list.description');
exports.builder = function builder(yargs) {
  return yargs
    .option('j', {
      alias: 'json',
      describe: i18n.t('sushi.list.options.json'),
      type: 'boolean',
    })
    .option('q', {
      alias: 'query',
      describe: i18n.t('sushi.list.options.query'),
      type: 'string',
    })
    .option('s', {
      alias: 'sort',
      describe: i18n.t('sushi.list.options.sort'),
      type: 'string',
    })
    .option('n', {
      alias: 'ndjson',
      describe: i18n.t('sushi.list.options.ndjson'),
      type: 'boolean',
    })
    .option('it', {
      alias: 'interactive',
      describe: i18n.t('sushi.list.options.interactive'),
      type: 'boolean',
    })
    .option('size', {
      describe: i18n.t('sushi.list.options.size'),
      type: 'number',
      default: 100,
    })
    .option('page', {
      describe: i18n.t('sushi.list.options.page'),
      type: 'number',
      default: 1,
    })
    .option('a', {
      alias: 'all',
      describe: i18n.t('sushi.list.options.all'),
      type: 'boolean',
    })
    .option('c', {
      alias: 'connection',
      describe: i18n.t('sushi.list.options.connection'),
      choices: ['working', 'faulty', 'untested'],
    });
};
exports.handler = async function handler(argv) {
  const {
    json,
    ndjson,
    verbose,
    query,
    sort,
    size,
    page,
    all,
  } = argv;

  let { institutionIds } = argv;

  const availableFields = [
    'id',
    'institution.name',
    'endpoint.vendor',
    'tags',
    'customerId',
    'requestorId',
    'apiKey',
    'comment',
  ];

  let fields = [];

  if (argv.fields) {
    fields = argv.fields.split(',').map((field) => field.trim());

    const unknownFields = fields.filter((field) => !availableFields.includes(field));

    if (unknownFields.length > 0) {
      console.error(i18n.t('global.unknownFields', { fields: unknownFields.join(',') }));
      process.exit(1);
    }
  }

  if (fields.length === 0) {
    fields = [
      'id',
      'institution.name',
      'endpoint.vendor',
      'tags',
    ];
  }

  if (!institutionIds?.length && argv.interactive) {
    if (verbose) {
      console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
    }

    let institutions;
    try {
      const { data } = await institutionsLib.getAll();
      if (data) { institutions = data; }
    } catch (error) {
      console.error(formatApiError(error));
      process.exit(1);
    }

    if (!Array.isArray(institutions) || institutions.length === 0) {
      console.log(i18n.t('institutions.institutionsNotFound'));
      process.exit(0);
    }

    ({ institutionsSelected: institutionIds } = await itMode.selectInstitutions(institutions));
  }

  let sushiData = [];

  try {
    const { data } = await sushiLib.getAll({
      institutionId: institutionIds,
      include: ['institution', 'endpoint'],
      q: query,
      sort,
      size: all ? undefined : size,
      page,
    });
    sushiData = data;
  } catch (err) {
    console.error(formatApiError(err));
    process.exit(1);
  }

  if (ndjson) {
    sushiData.forEach((sushi) => console.log(JSON.stringify(sushi)));
    process.exit(0);
  }

  if (json) {
    console.log(JSON.stringify(sushiData, null, 2));
    process.exit(0);
  }

  const header = fields.map((field) => i18n.t(`sushi.list.fields.${field}`));
  const lines = sushiData.map((sushi) => fields.map((field) => (get(sushi, field, ''))));

  console.log(table([header, ...lines]));
};
