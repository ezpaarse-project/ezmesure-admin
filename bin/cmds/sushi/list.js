const { i18n } = global;

const { table } = require('table');

const { config } = require('../../../lib/app/config');
const institutionsLib = require('../../../lib/institutions');
const itMode = require('./interactive/info');

exports.command = 'list [institutionIds...]';
exports.desc = i18n.t('sushi.list.description');
exports.builder = function builder(yargs) {
  return yargs.option('j', {
    alias: 'json',
    describe: i18n.t('sushi.list.options.json'),
    type: 'boolean',
  }).option('n', {
    alias: 'ndjson',
    describe: i18n.t('sushi.list.options.ndjson'),
    type: 'boolean',
  }).option('it', {
    alias: 'interactive',
    describe: i18n.t('sushi.list.options.interactive'),
    type: 'boolean',
  }).option('a', {
    alias: 'all',
    describe: i18n.t('sushi.list.options.all'),
    type: 'boolean',
  });
};
exports.handler = async function handler(argv) {
  const {
    json,
    ndjson,
    verbose,
    institutionIds,
  } = argv;

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    if (data) { institutions = data; }
  } catch (error) {
    console.error(`[Error#${error?.response?.data?.status}] ${error?.response?.data?.error}`);
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
    if (verbose) {
      console.log(`* Retrieving SUSHI information for institution [${institutionsSelected[i].name}] from ${config.ezmesure.baseUrl}`);
    }

    try {
      const { data } = await institutionsLib.getSushi(institutionsSelected[i].id);
      sushiData.push({
        institution: institutionsSelected[i].name,
        sushi: data,
      });
    } catch (err) {
      console.error(`[Error#${err?.response?.data?.status}] ${err?.response?.data?.error}`);
      process.exit(0);
    }
  }

  if (!argv.all) {
    sushiData = sushiData.filter((x) => x.sushi.length);
  }

  if (ndjson) {
    sushiData.forEach((el) => console.log(JSON.stringify(el)));
    process.exit(0);
  }

  if (json) {
    console.log(JSON.stringify(sushiData, null, 2));
    process.exit(0);
  }

  const header = [
    i18n.t('sushi.list.institution'),
    i18n.t('sushi.list.package'),
    i18n.t('sushi.list.vendor'),
    i18n.t('sushi.list.endpoint'),
    i18n.t('sushi.list.customerId'),
    i18n.t('sushi.list.requestorId'),
    i18n.t('sushi.list.apiKey'),
    i18n.t('sushi.list.comment'),
  ];

  const lines = [];
  sushiData.sort((a, b) => b.sushi.length - a.sushi.length)
    .forEach((el) => {
      if (argv.all && !el.sushi.length) {
        lines.push([el.institution, '', '', '', '', '', '', '']);
      }

      el?.sushi?.forEach((platform) => {
        lines.push([
          el.institution || '',
          platform.package || '',
          platform.vendor || '',
          platform.sushiUrl || '',
          platform.customerId || '',
          platform.requestorId || '',
          platform.apiKey || '',
          platform.comment || '',
        ]);
      });
    });

  console.log(table([header, ...lines]));
};
