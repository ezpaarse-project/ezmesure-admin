const ezmesure = require('../../lib/app/ezmesure');
const { config } = require('../../lib/app/config');
const { formatApiError } = require('../../lib/utils');

exports.command = 'profile';
exports.desc = 'Displays the person who is connected to the command';
exports.builder = function builder() {};
exports.handler = async function handler(argv) {
  const { verbose } = argv;

  if (verbose) {
    console.log(`* Retrieving the ezMESURE profile from ${config.ezmesure.baseUrl}`);
  }

  let profile;
  try {
    const { data } = await ezmesure.get('/profile');
    profile = data;
  } catch (error) {
    console.error(formatApiError(error));
    process.exit(1);
  }

  console.log(`You are authenticated as ${profile?.username} on ${config.ezmesure.baseUrl}`);
  console.log(`Roles: ${profile?.roles?.join(', ')}`);
};
