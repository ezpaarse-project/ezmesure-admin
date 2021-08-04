const { config } = require('../../lib/app/config');
const { handler: deleteToken } = require('./config/delete');

exports.command = 'logout';
exports.desc = 'Log out from ezMESURE';
exports.builder = function builder() {};
exports.handler = async function handler() {
  await deleteToken({ key: 'ezmesure.token' });
  await deleteToken({ key: 'ezmesure.token', global: true });

  console.log(`Removing login credentials for ${config?.ezmesure?.baseUrl}`);
};
