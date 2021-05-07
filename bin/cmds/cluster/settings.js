const { i18n } = global;

const { getSettings } = require('../../../lib/cluster');

exports.command = 'settings';
exports.desc = i18n.t('cluster.settings.description');
exports.builder = {};
exports.handler = async function handler() {
  let response;
  try {
    const { body } = await getSettings();
    response = body;
  } catch (e) {
    const dataError = e.response && e.response.body && e.response.body.error;
    console.error(i18n.t('cluster.settings.failed'));
    console.error(dataError || e.message);
    process.exit(1);
  }

  console.log(JSON.stringify(response, null, 2));
  process.exit(0);
};
