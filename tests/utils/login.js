const exec = require('child_process').execFileSync;
const path = require('path');

const commandFile = path.resolve(process.cwd(), 'ezmesure-admin');

const { EZMESURE_ADMIN_USERNAME, EZMESURE_ADMIN_PASSWORD } = process.env;

module.exports = () => exec(commandFile, [
  'login',
  '--username',
  EZMESURE_ADMIN_USERNAME,
  '--password',
  EZMESURE_ADMIN_PASSWORD,
]);
