const { config } = require('../../lib/app/config');
const { handler: deleteToken } = require('./config/delete');

exports.command = 'logout';
exports.desc = 'Log out from ezMESURE';
exports.builder = function builder() {};
exports.handler = async function handler(argv) {
  if (argv.verbose) {
    console.log(`* Logout from ${config?.ezmesure?.baseUrl}`);
  }

  await deleteToken({ key: 'ezmesure.token' });
  await deleteToken({ key: 'ezmesure.token', global: true });

  console.log(`Removing login credentials for ${config?.ezmesure?.baseUrl}`);
};
