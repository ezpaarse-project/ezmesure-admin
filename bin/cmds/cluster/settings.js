const { getSettings } = require('../../../lib/cluster');

exports.command = 'settings';
exports.desc = 'Show cluster settings';
exports.builder = {};
exports.handler = async function handler() {
  let response;
  try {
    const { body } = await getSettings();
    response = body;
  } catch (e) {
    const dataError = e.response && e.response.body && e.response.body.error;
    console.error('Failed to get cluster settings');
    console.error(dataError || e.message);
    process.exit(1);
  }

  console.log(JSON.stringify(response, null, 2));
  process.exit(0);
};
