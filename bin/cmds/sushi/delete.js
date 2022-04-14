const { i18n } = global;

const sushiLib = require('../../../lib/sushi');
const institutionsLib = require('../../../lib/institutions');
const { config } = require('../../../lib/app/config');
const itMode = require('./interactive/list');
const { formatApiError } = require('../../../lib/utils');

exports.command = 'delete';
exports.desc = i18n.t('sushi.delete.description');
exports.builder = function builder() {};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  if (verbose) {
    console.log(`* Retrieving institutions from ${config.ezmesure.baseUrl}`);
  }

  let institutions;
  try {
    const { data } = await institutionsLib.getAll();
    if (data) { institutions = data; }
  } catch (error) {
    console.error(formatApiError(error));
  }

  if (!institutions) {
    console.log(i18n.t('institutions.institutionsNotFound'));
    process.exit(0);
  }

  const { institutionSelected } = await itMode.selectInstitutions(institutions);
  const institution = institutions.find(({ id }) => id === institutionSelected);

  let sushi;
  try {
    const { data } = await institutionsLib.getSushi(institutionSelected);
    if (data) { sushi = data; }
  } catch (err) {
    console.error(formatApiError(err));
  }

  const { vendorsSelected } = await itMode.selectVendors(sushi);

  if (!vendorsSelected) {
    console.log(i18n.t('sushi.noCredentialsFound'));
    process.exit(0);
  }

  try {
    if (verbose) {
      console.log(`* Remove SUSHI information for institution [${institution.name}] from ${config.ezmesure.baseUrl}`);
    }
    await sushiLib.delete(vendorsSelected);
  } catch (err) {
    console.error(formatApiError(err));
    process.exit(1);
  }

  console.log(i18n.t('sushi.delete.removed'));
};
