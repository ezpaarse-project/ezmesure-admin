const { i18n } = global;

const institutionsLib = require('../../../lib/institutions');

exports.command = 'refresh';
exports.desc = i18n.t('institutions.refresh.description');
exports.handler = async function handler() {
  try {
    await institutionsLib.refresh();
  } catch (error) {
    console.error(`[Error#${error.response.data.status}] ${error.response.data.error}`);
    process.exit(1);
  }
  console.log(i18n.t('institutions.refresh.refreshed'));
};
