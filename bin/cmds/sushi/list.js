const { i18n } = global;

const { table } = require('table');

const { config } = require('../../../lib/app/config');
const institutionsLib = require('../../../lib/institutions');
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
    institutionIds,
  } = argv;

  const availableFields = [
    'id',
    'institution',
    'package',
    'vendor',
    'endpoint',
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
      'institution',
      'vendor',
      'package',
    ];
  }

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

  if (Array.isArray(institutionIds) && institutionIds?.length > 0) {
    institutions = institutions
      .filter(({ id, name }) => institutionIds.includes(name) || institutionIds.includes(id));
  }

  if (!institutionIds?.length && argv.interactive) {
    const { institutionsSelected } = await itMode.selectInstitutions(institutions);

    institutions = institutions.filter(({ id }) => institutionsSelected.includes(id));
  }

  const institutionsSelected = institutions;

  let sushiData = [];

  for (let i = 0; i < institutionsSelected.length; i += 1) {
    const { name: institutionName } = institutionsSelected[i];

    if (verbose) {
      console.log(`* Retrieving SUSHI information for institution [${institutionName}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await institutionsLib.getSushi(
        institutionsSelected[i].id,
        { connection: argv.connection },
      );
      sushiData.push({
        institution: institutionName,
        sushi: data,
      });
    } catch (err) {
      console.error(formatApiError(err));
      process.exit(1);
    }
  }

  if (!argv.all) {
    sushiData = sushiData.filter((x) => x.sushi.length);
  }

  if (ndjson) {
    sushiData.forEach(({ institution, sushi }) => {
      sushi.forEach((item) => console.log(
        JSON.stringify({ ...item, institution }),
      ));
    });
    process.exit(0);
  }

  if (json) {
    console.log(JSON.stringify(sushiData, null, 2));
    process.exit(0);
  }

  const header = fields.map((field) => i18n.t(`sushi.list.fields.${field}`));

  const lines = sushiData
    .sort((a, b) => (a?.sushi?.length < b?.sushi?.length ? 1 : -1))
    .flatMap(({ institution, sushi }) => sushi.map((s) => ({ institution, ...s })))
    .map((sushi) => fields.map((field) => (sushi[field] || '')));

  console.log(table([header, ...lines]));
};
